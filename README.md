# Nike Initiative Tracker Dashboard

A modern, professional initiative tracking dashboard built with React, featuring a drag-and-drop Kanban board designed for Nike's development workflow.

![Dashboard Preview](https://img.shields.io/badge/React-18.2.0-blue) ![Material-UI](https://img.shields.io/badge/Material--UI-5.15.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

### Core Functionality
- **6-Stage Workflow**: DEV → QA → DEMO → UAT → Change Ticket → PROD
- **Drag & Drop**: Intuitive initiative movement between stages
- **Status Tracking**: Not Started, In Progress, Blocked, Done
- **Dependencies**: Link initiatives with dependency relationships
- **Data Persistence**: Automatic localStorage saving

### Import/Export
- **CSV Export**: Download all initiatives with full data
- **CSV Import**: Bulk upload initiatives from spreadsheets
- **Data Migration**: Automatic migration from old stage structures

### Modern UI
- **Professional Design**: Clean, Nike-ready interface
- **Color-Coded Stages**: Visual stage identification
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Professional drag-and-drop experience
- **Status Indicators**: Visual chips for initiative status

## 🛠️ Technology Stack

- **Frontend**: React 18.2.0
- **UI Framework**: Material-UI 5.15.0
- **Drag & Drop**: react-beautiful-dnd
- **CSV Processing**: PapaParse
- **Storage**: Browser localStorage
- **Deployment**: GitHub Pages ready

## 📦 Installation

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Local Development
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Install dependencies
npm install

# Start development server
npm start
```

The application will open at `http://localhost:3000`

## 🚀 Deployment to GitHub Pages

### 1. Update package.json
Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` in package.json homepage URL:
```json
"homepage": "https://yourusername.github.io/your-repo-name"
```

### 2. Deploy
```bash
# Build and deploy to GitHub Pages
npm run deploy
```

### 3. Enable GitHub Pages
1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "Deploy from a branch"
4. Choose `gh-pages` branch
5. Your dashboard will be live at the homepage URL!

## 💾 Data Management

### CSV Export/Import
- **Export**: Downloads all initiatives with stage, status, and dependencies
- **Import**: Upload CSV files to bulk create initiatives
- **Format**: Standard CSV with headers: id, title, description, status, stage, dependencies

### Data Persistence
- **Local Storage**: Data automatically saves to browser localStorage
- **Cross-Session**: Data persists between browser sessions
- **Migration**: Automatic migration when stage structure changes

## 🎯 Usage

### Adding Initiatives
1. Click the "+" button in any stage column
2. Fill in title, description, status, and dependencies
3. Initiative appears in the selected stage

### Moving Initiatives
- Drag initiatives between stages
- Visual feedback during drag operations
- Automatic saving after moves

### Managing Data
- **Export**: Use "Export CSV" to download all data
- **Import**: Use "Import CSV" to bulk upload initiatives
- **Save**: Click "Save Changes" to manually trigger save

## 🔧 Customization

### Stage Configuration
Modify stages in `src/App.js`:
```javascript
const STAGES = [
  'DEV',
  'QA', 
  'DEMO',
  'UAT',
  'Change Ticket',
  'PROD'
];
```

### Stage Colors
Update colors in `STAGE_COLORS` object:
```javascript
const STAGE_COLORS = {
  'DEV': '#1976d2',
  'QA': '#ed6c02',
  // ... etc
};
```

## 🌐 GitHub Pages Compatibility

✅ **Fully Compatible Features:**
- CSV Export (client-side download)
- CSV Import (client-side file reading)
- Drag & Drop functionality
- Data persistence (localStorage)
- All UI interactions

❌ **Not Available:**
- Server-side data storage
- Real-time collaboration
- Email notifications

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your organization.

## 🆘 Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include browser version and steps to reproduce

---

**Built for Nike** - Professional initiative tracking made simple. 