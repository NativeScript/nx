const { getJestProjects } = require('@nrwl/jest');

module.exports = { projects: [...getJestProjects(), '<rootDir>/e2e/nx-e2e'] };
