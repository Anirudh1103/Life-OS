module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  env: {
    browser: true,
    es2024: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:jsx-a11y/recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['react', 'react-hooks', 'jsx-a11y', '@typescript-eslint'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react/jsx-props-no-spreading': 'off',
  },
  overrides: [
    {
      files: ['vite.config.ts'],
      parserOptions: {
        project: ['./tsconfig.node.json'],
      },
    },
  ],
  ignorePatterns: ['dist', 'node_modules'],
};
