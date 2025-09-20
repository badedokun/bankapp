module.exports = {
  // Root directory for tests
  rootDir: './',
  
  // Test environments for different parts of the app
  projects: [
    // Frontend React Native tests
    {
      displayName: 'React Native',
      preset: 'react-native',
      testMatch: [
        '<rootDir>/src/**/*.test.{ts,tsx}',
        '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-vector-icons)/)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testEnvironment: 'node',
    },
    
    // Backend Node.js tests
    {
      displayName: 'Backend',
      testMatch: [
        '<rootDir>/server/**/*.test.{ts,js}',
        '<rootDir>/server/**/__tests__/**/*.{ts,js}',
        '<rootDir>/tests/backend/**/*.test.{ts,js}',
      ],
      testEnvironment: 'node',
      preset: 'ts-jest',
      moduleFileExtensions: ['ts', 'js', 'json', 'node'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts'],
      collectCoverageFrom: [
        'server/**/*.{ts,js}',
        '!server/**/*.d.ts',
        '!server/node_modules/**',
        '!server/dist/**',
      ],
    },
    
    // Integration tests
    {
      displayName: 'Integration',
      testMatch: [
        '<rootDir>/tests/integration/**/*.test.{ts,js}',
      ],
      testEnvironment: 'node',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
    },
    
    // UX Validation tests
    {
      displayName: 'UX Tests',
      preset: 'react-native',
      testMatch: [
        '<rootDir>/tests/ux/**/*.test.{ts,tsx}',
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-vector-icons)/)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testEnvironment: 'node',
    },
    
    // Framework validation tests
    {
      displayName: 'Framework Tests',
      preset: 'react-native',
      testMatch: [
        '<rootDir>/tests/framework/**/*.test.{ts,tsx}',
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-vector-icons)/)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testEnvironment: 'node',
    },
  ],
  
  // Global settings
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 25,
      lines: 30,
      statements: 30,
    },
  },
  
  // Test patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/server/dist/',
  ],
  
  // Global test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
};
