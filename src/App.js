import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Chip, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Papa from 'papaparse';

const STAGES = [
  'DEV',
  'QA',
  'DEMO',
  'UAT',
  'Change Ticket',
  'PROD',
];

const LOCAL_STORAGE_KEY = 'initiative-tracker-board';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'default' },
  { value: 'in_progress', label: 'In Progress', color: 'primary' },
  { value: 'blocked', label: 'Blocked', color: 'warning' },
  { value: 'done', label: 'Done', color: 'success' },
];

const STAGE_COLORS = {
  'DEV': '#1976d2',
  'QA': '#ed6c02', 
  'DEMO': '#9c27b0',
  'UAT': '#2e7d32',
  'Change Ticket': '#d32f2f',
  'PROD': '#1565c0'
};

function loadBoard() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveBoard(board) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(board));
}

function migrateBoard(board) {
  // Migration mapping from old stages to new stages
  const stageMapping = {
    'Idea': 'DEV',
    'Planning': 'DEV', 
    'Development': 'DEV',
    'QA': 'QA',
    'Production': 'PROD'
  };

  const newColumns = {};
  // Initialize all new stages with empty arrays
  STAGES.forEach(stage => {
    newColumns[stage] = [];
  });

  // Migrate initiatives from old columns to new columns
  if (board.columns) {
    Object.entries(board.columns).forEach(([oldStage, initiatives]) => {
      const newStage = stageMapping[oldStage] || oldStage;
      if (STAGES.includes(newStage)) {
        newColumns[newStage] = [...newColumns[newStage], ...initiatives];
      } else {
        // If no mapping exists and it's not a new stage, put in DEV
        newColumns['DEV'] = [...newColumns['DEV'], ...initiatives];
      }
    });
  }

  return {
    ...board,
    columns: newColumns
  };
}

function getInitialBoard() {
  const saved = loadBoard();
  if (saved) {
    // Check if migration is needed
    const hasOldStages = saved.columns && Object.keys(saved.columns).some(stage => !STAGES.includes(stage));
    if (hasOldStages) {
      const migrated = migrateBoard(saved);
      saveBoard(migrated); // Save the migrated version
      return migrated;
    }
    
    // Ensure all new stages exist in columns
    const columns = { ...saved.columns };
    STAGES.forEach(stage => {
      if (!columns[stage]) {
        columns[stage] = [];
      }
    });
    
    return { ...saved, columns };
  }
  
  // Default empty board
  const columns = {};
  STAGES.forEach(stage => {
    columns[stage] = [];
  });
  return { columns, initiatives: {} };
}

function App() {
  const [board, setBoard] = useState(getInitialBoard);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', dependencies: [], status: 'not_started' });

  useEffect(() => {
    saveBoard(board);
  }, [board]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const startCol = board.columns[source.droppableId];
    const finishCol = board.columns[destination.droppableId];
    let newColumns = { ...board.columns };
    // Remove from source
    const [movedId] = newColumns[source.droppableId].splice(source.index, 1);
    // Insert into destination
    newColumns[destination.droppableId].splice(destination.index, 0, movedId);
    setBoard({ ...board, columns: newColumns });
  };

  const handleOpenDialog = (stage, id = null) => {
    setEditId(id);
    if (id) {
      const initiative = board.initiatives[id];
      setForm({
        title: initiative.title,
        description: initiative.description,
        dependencies: initiative.dependencies || [],
        status: initiative.status || 'not_started',
      });
    } else {
      setForm({ title: '', description: '', dependencies: [], status: 'not_started' });
    }
    setDialogOpen(stage);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditId(null);
    setForm({ title: '', description: '', dependencies: [], status: 'not_started' });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleDependenciesChange = (e) => {
    const { options } = e.target;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    setForm({ ...form, dependencies: selected });
  };

  const handleSaveInitiative = () => {
    if (!form.title.trim()) return;
    if (editId) {
      setBoard(prev => ({
        ...prev,
        initiatives: {
          ...prev.initiatives,
          [editId]: { ...prev.initiatives[editId], ...form },
        },
      }));
    } else {
      const id = Date.now().toString();
      setBoard(prev => ({
        ...prev,
        initiatives: {
          ...prev.initiatives,
          [id]: { id, ...form },
        },
        columns: {
          ...prev.columns,
          [dialogOpen]: [id, ...prev.columns[dialogOpen]],
        },
      }));
    }
    handleCloseDialog();
  };

  const handleDeleteInitiative = (id) => {
    // Remove from all columns
    const newColumns = {};
    Object.keys(board.columns).forEach(stage => {
      newColumns[stage] = board.columns[stage].filter(iid => iid !== id);
    });
    const newInitiatives = { ...board.initiatives };
    delete newInitiatives[id];
    setBoard({ columns: newColumns, initiatives: newInitiatives });
  };

  const handleExportCSV = () => {
    // Flatten initiatives for CSV
    const rows = [];
    Object.entries(board.initiatives).forEach(([id, initiative]) => {
      // Find the stage (column) for this initiative
      const stage = Object.keys(board.columns).find(col => board.columns[col].includes(id)) || '';
      rows.push({
        id,
        title: initiative.title,
        description: initiative.description,
        status: initiative.status,
        stage,
        dependencies: (initiative.dependencies || []).join(','),
      });
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'initiatives.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const initiatives = {};
        const columns = {};
        STAGES.forEach(stage => { columns[stage] = []; });
        results.data.forEach(row => {
          if (!row.id) return;
          initiatives[row.id] = {
            id: row.id,
            title: row.title,
            description: row.description,
            status: row.status || 'not_started',
            dependencies: row.dependencies ? row.dependencies.split(',').filter(Boolean) : [],
          };
          if (columns[row.stage]) {
            columns[row.stage].push(row.id);
          }
        });
        setBoard({ initiatives, columns });
      },
      error: (err) => {
        alert('Failed to import CSV: ' + err.message);
      },
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700, 
            color: '#1a1a1a',
            mb: 1,
            letterSpacing: '-0.02em'
          }}
        >
          Initiative Tracker Dashboard
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#666',
            fontWeight: 400,
            mb: 3
          }}
        >
          Track your initiatives through the development lifecycle
        </Typography>
      </Box>
      
      <Box 
        display="flex" 
        justifyContent="center" 
        gap={2} 
        mb={4}
        sx={{
          '& .MuiButton-root': {
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5
          }
        }}
      >
        <Button 
          variant="outlined" 
          onClick={handleExportCSV}
          sx={{ 
            borderColor: '#1976d2',
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              bgcolor: '#f3f7ff'
            }
          }}
        >
          Export CSV
        </Button>
        <Button 
          variant="outlined" 
          component="label"
          sx={{ 
            borderColor: '#1976d2',
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              bgcolor: '#f3f7ff'
            }
          }}
        >
          Import CSV
          <input type="file" accept=".csv" hidden onChange={handleImportCSV} />
        </Button>
        <Button 
          variant="contained" 
          onClick={() => saveBoard(board)}
          sx={{
            bgcolor: '#1976d2',
            '&:hover': {
              bgcolor: '#1565c0'
            },
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
          }}
        >
          Save Changes
        </Button>
      </Box>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={0} alignItems="flex-start">
          {STAGES.map(stage => (
            <Grid item xs={12} sm={6} md={2} key={stage}>
              <Box 
                sx={{ 
                  bgcolor: 'white',
                  borderRadius: 3,
                  p: 2,
                  minHeight: 600,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: STAGE_COLORS[stage],
                    borderRadius: '12px 12px 0 0'
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} mt={1}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#1a1a1a',
                        fontSize: '1.1rem',
                        mb: 0.5
                      }}
                    >
                      {stage}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#666',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {board.columns[stage]?.length || 0} items
                    </Typography>
                  </Box>
                  <Tooltip title={`Add initiative to ${stage}`}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(stage)}
                      sx={{
                        bgcolor: STAGE_COLORS[stage],
                        color: 'white',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          bgcolor: STAGE_COLORS[stage],
                          opacity: 0.8,
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <Box 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      sx={{ 
                        minHeight: 500,
                        bgcolor: snapshot.isDraggingOver ? '#f3f7ff' : 'transparent',
                        borderRadius: 2,
                        transition: 'background-color 0.2s ease',
                        p: snapshot.isDraggingOver ? 0.5 : 0
                      }}
                    >
                      {board.columns[stage]?.map((id, idx) => {
                        const initiative = board.initiatives[id];
                        if (!initiative) return null;
                        return (
                          <Draggable draggableId={id} index={idx} key={id}>
                            {(provided, snapshot) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                  bgcolor: 'white',
                                  borderRadius: 2,
                                  boxShadow: snapshot.isDragging 
                                    ? '0 8px 24px rgba(0,0,0,0.15)' 
                                    : '0 2px 8px rgba(0,0,0,0.1)',
                                  p: 2,
                                  mb: 1.5,
                                  opacity: snapshot.isDragging ? 0.9 : 1,
                                  transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                  transition: 'all 0.2s ease',
                                  border: '1px solid #e8e8e8',
                                  cursor: 'grab',
                                  '&:hover': {
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                    transform: 'translateY(-2px)'
                                  },
                                  '&:active': {
                                    cursor: 'grabbing'
                                  }
                                }}
                              >
                                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography 
                                      variant="subtitle1" 
                                      sx={{ 
                                        fontWeight: 600,
                                        color: '#1a1a1a',
                                        lineHeight: 1.3,
                                        mb: 0.5,
                                        wordBreak: 'normal',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'normal'
                                      }}
                                    >
                                      {initiative.title}
                                    </Typography>
                                    <Chip
                                      label={STATUS_OPTIONS.find(opt => opt.value === (initiative.status || 'not_started'))?.label}
                                      color={STATUS_OPTIONS.find(opt => opt.value === (initiative.status || 'not_started'))?.color}
                                      size="small"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        height: 24,
                                        fontWeight: 600
                                      }}
                                    />
                                  </Box>
                                </Box>
                                
                                {initiative.description && (
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: '#666',
                                      mb: 1.5,
                                      lineHeight: 1.4,
                                      wordBreak: 'normal',
                                      overflowWrap: 'break-word',
                                      whiteSpace: 'normal'
                                    }}
                                  >
                                    {initiative.description}
                                  </Typography>
                                )}
                                
                                {initiative.dependencies && initiative.dependencies.length > 0 && (
                                  <Box 
                                    sx={{ 
                                      bgcolor: '#f8f9fa',
                                      borderRadius: 1,
                                      p: 1,
                                      mb: 1.5,
                                      border: '1px solid #e8e8e8'
                                    }}
                                  >
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: '#666',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        fontSize: '0.7rem'
                                      }}
                                    >
                                      Dependencies:
                                    </Typography>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        color: '#333',
                                        fontSize: '0.8rem',
                                        mt: 0.5,
                                        wordBreak: 'normal',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'normal'
                                      }}
                                    >
                                      {initiative.dependencies.map(depId => board.initiatives[depId]?.title || 'Unknown').join(', ')}
                                    </Typography>
                                  </Box>
                                )}
                                
                                <Box display="flex" gap={1} justifyContent="flex-end">
                                  <Tooltip title="Edit">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleOpenDialog(stage, id)}
                                      sx={{
                                        color: '#666',
                                        '&:hover': {
                                          color: '#1976d2',
                                          bgcolor: '#f3f7ff'
                                        }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteInitiative(id)}
                                      sx={{
                                        color: '#666',
                                        '&:hover': {
                                          color: '#d32f2f',
                                          bgcolor: '#fff3f3'
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>
      
      <Dialog 
        open={!!dialogOpen} 
        onClose={handleCloseDialog} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 1,
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#1a1a1a'
          }}
        >
          {editId ? 'Edit Initiative' : `Add Initiative to ${dialogOpen}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Title"
            type="text"
            fullWidth
            value={form.title}
            onChange={handleFormChange}
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={handleFormChange}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <Box mt={2} mb={2}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Dependencies</Typography>
            <select
              multiple
              value={form.dependencies}
              onChange={handleDependenciesChange}
              style={{ 
                width: '100%', 
                minHeight: 80,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            >
              {Object.values(board.initiatives)
                .filter(i => !editId || i.id !== editId)
                .map(i => (
                  <option key={i.id} value={i.id}>{i.title}</option>
                ))}
            </select>
          </Box>
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={form.status}
              label="Status"
              onChange={handleFormChange}
            >
              {STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              color: '#666'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveInitiative} 
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#1976d2',
              '&:hover': {
                bgcolor: '#1565c0'
              },
              borderRadius: 2,
              px: 3
            }}
          >
            {editId ? 'Save Changes' : 'Add Initiative'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App; 