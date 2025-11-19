# Masikip Notes - iCloud Notes Clone

A frontend-only web application that replicates the user experience of the iCloud Notes web interface with blockchain integration capabilities.

## Features Implemented

### ✅ Feature 1: Create New Note (Transaction: CREATE_NOTE)
- Click the "📝" button in the sidebar to create a new note
- New notes are automatically selected and ready for editing
- Notes are given default titles that update based on the first line of content
- Real-time content preview in the sidebar

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Sidebar.jsx     # Left sidebar with notes list and search
│   └── NoteEditor.jsx  # Main note editing area
├── pages/              # Page components
│   └── NotesPage.jsx   # Main notes application page
├── styles/             # CSS styling files
│   ├── NotesPage.css   # Main app layout styles
│   ├── Sidebar.css     # Sidebar component styles
│   └── NoteEditor.css  # Note editor component styles
└── App.jsx             # Root application component
```

## Technology Stack

- **React 19.1.1** - Frontend framework
- **Vite** - Build tool and development server
- **CSS3** - Styling with custom properties for theming
- **ES6+ JavaScript** - Modern JavaScript features

## UI/UX Features

- **Dark Theme**: Matches iCloud Notes' dark interface
- **Responsive Layout**: Sidebar and main content area
- **Search Functionality**: Filter notes by title or content
- **Collapsible Sections**: Expandable/collapsible note sections
- **Real-time Updates**: Notes update automatically as you type
- **Visual Feedback**: Selected notes are highlighted

## Key Components

### NotesPage
- Main application container
- Manages notes state and note selection
- Handles note creation and updates
- Coordinates between Sidebar and NoteEditor

### Sidebar
- Displays notes list with previews
- Search functionality
- Section management (Pinned, Notes)
- New note creation button
- Folder management placeholder

### NoteEditor
- Full-screen note editing experience
- Auto-focus on new notes
- Real-time content updates
- Note metadata display (date/time)

## Styling Approach

The application uses a modular CSS approach with:
- **Component-specific stylesheets** for maintainability
- **CSS custom properties** for consistent theming
- **Flexbox layouts** for responsive design
- **Webkit scrollbar styling** for custom scrollbars
- **Hover states and transitions** for interactive feedback

## Future Features (Roadmap)

The application is designed to be extensible. Planned features include:

2. **View and Edit Note** (Transaction: UPDATE_NOTE)
3. **Delete Note** (Transaction: DELETE_NOTE)
4. **Search Note** (Enhanced search capabilities)
5. **Note Prioritization** (Transaction: SET_PRIORITY)
6. **Styling Options** (Transaction: STYLE_NOTE)
7. **Auto Save** (Transaction: AUTO_SAVE)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Browser Support

- Modern browsers with ES6+ support
- Optimized for WebKit-based browsers (Chrome, Safari, Edge)
- CSS Grid and Flexbox support required
