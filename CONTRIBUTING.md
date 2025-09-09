# Contributing to AI YouTuber

Thank you for your interest in contributing to AI YouTuber! This guide will help you get started with contributing to our multi-channel educational content generation system.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Development Guidelines](#development-guidelines)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful**: Treat all community members with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be educational**: This project aims to help learners worldwide

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Basic understanding of Next.js, TypeScript, and React
- Familiarity with PostgreSQL and API development
- Understanding of YouTube Data API (for upload features)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/ai-youtuber.git
   cd ai-youtuber
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Database Setup**
   ```bash
   node setup-database.js
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## How to Contribute

### 🐛 Bug Reports

When filing a bug report, please include:

- **Clear description** of the issue
- **Steps to reproduce** the bug
- **Expected vs actual behavior**
- **Environment details** (OS, Node version, etc.)
- **Screenshots or logs** if applicable

### 💡 Feature Requests

For new features, please provide:

- **Use case description** - why is this needed?
- **Proposed solution** - how should it work?
- **Alternative approaches** - other ways to solve the problem
- **Impact assessment** - who would benefit?

### 🔧 Code Contributions

Areas where contributions are especially welcome:

#### Content Generation
- **New Personas**: Additional educational content types (math, science, languages)
- **Content Formats**: New visual layouts and question types
- **AI Prompting**: Improvements to content generation quality
- **Validation**: Better content quality checking

#### Visual System
- **Themes**: New visual themes and branding options
- **Layouts**: Additional frame layouts for different content types
- **Animations**: Enhanced visual effects and transitions
- **Accessibility**: Better support for different devices and accessibility needs

#### Analytics & Optimization
- **Performance Tracking**: Enhanced metrics and insights
- **A/B Testing**: Framework for testing different content approaches
- **Scheduling**: Improved upload timing optimization
- **Reporting**: Better dashboard and reporting features

#### Infrastructure
- **Database**: Query optimization and new features
- **Security**: Enhanced credential management and security features
- **API**: Additional endpoints and improved error handling
- **Documentation**: Code comments, guides, and examples

## Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/your-bug-fix
```

### 2. Make Your Changes

- Follow our [Development Guidelines](#development-guidelines)
- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run type checking
npm run build

# Test the application
npm run dev
# Verify your changes work as expected
```

### 4. Submit Pull Request

- **Title**: Clear, descriptive title
- **Description**: Explain what changes you made and why
- **Testing**: Describe how you tested your changes
- **Screenshots**: Include visuals for UI changes
- **Breaking Changes**: Note any breaking changes

### 5. Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged

## Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Naming**: Use descriptive variable and function names
- **Comments**: Add comments for complex logic
- **Formatting**: Follow existing code formatting patterns

### File Organization

```
lib/generation/
├── core/           # Core generation logic
├── personas/       # Account-specific content generation
├── routing/        # Content routing and format selection
└── shared/         # Shared utilities and types

lib/visuals/
├── layouts/        # Frame layout systems
├── themes.ts       # Visual theme definitions
└── themeMap.ts     # Theme routing logic
```

### Database Changes

- **Migrations**: Create migration files for schema changes
- **Backward Compatibility**: Ensure changes don't break existing data
- **Documentation**: Update schema documentation

### API Guidelines

- **Consistent Structure**: Follow existing API patterns
- **Error Handling**: Implement proper error responses
- **Security**: Validate all inputs and protect sensitive data
- **Documentation**: Document new endpoints

## Testing

### Manual Testing

- Test content generation pipeline end-to-end
- Verify multi-account functionality
- Check visual frame generation
- Test YouTube upload process (use test accounts)

### Automated Testing

```bash
# Run type checking
npm run build

# Future: Unit tests, integration tests
# npm test (when test suite is added)
```

### Content Quality Testing

- Generate sample content for different personas
- Verify visual quality and readability
- Test on different devices and screen sizes
- Ensure educational value and accuracy

## Project Architecture

### Key Components

1. **Content Generation** (`lib/generation/`)
   - AI-powered content creation
   - Persona-specific prompting
   - Content validation and quality control

2. **Visual System** (`lib/visuals/`)
   - Frame layout generation
   - Theme management
   - Brand-specific styling

3. **Account Management** (`lib/accounts.ts`)
   - Multi-channel support
   - Credential encryption
   - Account-specific configurations

4. **Pipeline Management** (`app/api/jobs/`)
   - Job queue management
   - Error handling and retries
   - Progress tracking

### Adding New Features

#### New Content Persona

1. Create persona definition in `lib/generation/personas/`
2. Add routing in `lib/generation/routing/`
3. Create visual theme if needed
4. Update account configuration
5. Add to documentation

#### New Visual Layout

1. Create layout in `lib/visuals/layouts/`
2. Update layout selector
3. Add theme support
4. Test with different content types
5. Document usage

## Community

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Documentation**: Check CLAUDE.md for detailed project info

### Staying Updated

- **Watch** the repository for notifications
- **Star** the project to show support
- **Follow** releases for updates

### Recognition

Contributors will be recognized in:
- Repository contributors list
- Release notes for significant contributions
- Special mentions for outstanding contributions

## License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

**Thank you for helping make educational content more accessible worldwide! 🌍📚**