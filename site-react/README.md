# Pango Site 🚀

A modern web application built with React, TypeScript, and Vite.

## 🛠️ Tech Stack

- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Material-UI](https://mui.com/) - React UI component library
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [React Router](https://reactrouter.com/) - Application routing
- [GraphQL](https://graphql.org/) - API query language
- [Framer Motion](https://www.framer.com/motion/) - Animation library

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/pantherdb/pango.git
cd pango/site-react
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run start` - Start server on port 4208 (development mode)
- `npm run start:staging` - Start server in staging mode
- `npm run build` - Build for production
- `npm run build:staging` - Build for staging
- `npm run build:production` - Build for production with optimizations
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests
- `npm run format` - Format code with Prettier
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Check TypeScript types

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory for environment variables:

```env
VITE_API_URL=your_api_url_here
```

Access variables in your code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

### Tailwind CSS

Tailwind is configured in `tailwind.config.js`. Make sure your global CSS file includes:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 🧪 Testing (Writing tests soon)

This project uses Vitest with React Testing Library. Run tests with:

```bash
npm run test
```

## 📝 Code Quality

- **ESLint**: Run `npm run lint` to check for issues
- **Prettier**: Run `npm run format` to format code
- **TypeScript**: Run `npm run type-check` to verify types

## 🚀 Deployment

1. Build the project:

```bash
npm run build:production
```

1. Deploy the `dist` directory to functionome server or ...

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is part of the Pango repository. See the repository's LICENSE file for details.
