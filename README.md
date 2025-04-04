# Mirascope Website

URL: [https://mirascope.com](https://mirascope.com)

## Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Commands

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm run test` - Run tests
- `npm run typecheck` - Check TypeScript types
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files need formatting

### Pre-commit Hooks

This project uses [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) to automatically:

1. Format staged files with Prettier
2. Run TypeScript type checking

These checks run automatically when you attempt to commit changes, helping maintain code quality and consistency.

## License

Everything in this repository is licensed under the [MIT License](https://github.com/Mirascope/website/blob/main/LICENSE) except for "Williams-Handwriting-Regular-v1.tff", which is a closed license font and not available for use without express permission.
