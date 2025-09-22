# End-to-End Testing Documentation

This directory contains comprehensive end-to-end tests for the Real Estate CRM application using Playwright.

## Test Structure

### Core Test Files

- **`auth.spec.ts`** - Authentication flow testing including login, registration, password recovery, and OAuth
- **`dashboard.spec.ts`** - Dashboard functionality, metrics display, charts, and real-time updates
- **`client-management.spec.ts`** - Client CRUD operations, search, filtering, stage progression, and document management
- **`financial-management.spec.ts`** - Revenue analytics, transaction management, commission calculations, and CSV operations
- **`calendar-scheduling.spec.ts`** - Calendar views, appointment management, deadline tracking, and external integrations

### Specialized Test Files

- **`cross-browser.spec.ts`** - Cross-browser compatibility testing across Chrome, Firefox, Safari, and mobile browsers
- **`mobile-responsiveness.spec.ts`** - Mobile and tablet responsiveness testing with various viewport sizes
- **`visual-regression.spec.ts`** - Visual regression testing to catch UI changes and styling issues
- **`performance.spec.ts`** - Performance testing including Core Web Vitals, load times, and resource optimization

### Utilities and Fixtures

- **`utils/test-helpers.ts`** - Reusable helper functions for common test operations
- **`fixtures/test-data.ts`** - Test data fixtures and mock API responses

## Running Tests

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Specialized Test Runs

```bash
# Mobile responsiveness tests
npm run test:e2e:mobile

# Cross-browser compatibility tests
npm run test:e2e:cross-browser

# Visual regression tests
npm run test:e2e:visual

# Performance tests
npm run test:e2e:performance

# Run all tests (unit + E2E)
npm run test:all
```

### Running Specific Tests

```bash
# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run specific test by name
npx playwright test --grep "should login successfully"

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests with specific tag
npx playwright test --grep "@smoke"
```

## Test Configuration

### Playwright Configuration

The tests are configured in `playwright.config.ts` with the following features:

- **Multi-browser support**: Chrome, Firefox, Safari, Edge
- **Mobile device testing**: iPhone, Pixel, iPad
- **Parallel execution**: Tests run in parallel for faster execution
- **Automatic retries**: Failed tests are retried automatically
- **Screenshots and videos**: Captured on failure for debugging
- **Test reports**: HTML, JSON, and JUnit formats

### Environment Setup

Tests require the following environment variables:

```bash
BASE_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_SECRET=your_nextauth_secret
RESEND_API_KEY=your_resend_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Test Categories

### 1. Critical User Journeys

These tests cover the most important user flows:

- **Authentication Flow**: Login, registration, password recovery
- **Client Management**: Add, edit, delete, search clients
- **Financial Operations**: Create transactions, calculate commissions
- **Calendar Operations**: Schedule appointments, track deadlines

### 2. Cross-Browser Compatibility

Tests ensure the application works consistently across:

- **Desktop Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: Mobile Chrome, Mobile Safari
- **Different Viewport Sizes**: Desktop, tablet, mobile

### 3. Mobile Responsiveness

Comprehensive mobile testing including:

- **Device-Specific Testing**: iPhone, Pixel, iPad variants
- **Viewport Testing**: Custom viewport sizes from 320px to 1920px
- **Touch Interactions**: Tap, swipe, pinch gestures
- **Mobile-Specific UI**: Mobile menus, FABs, responsive layouts

### 4. Visual Regression

Visual testing to catch UI changes:

- **Component Screenshots**: Individual component visual testing
- **Page Screenshots**: Full page visual comparisons
- **State Screenshots**: Loading, error, and success states
- **Responsive Screenshots**: Different viewport sizes
- **Accessibility Screenshots**: Focus states, high contrast

### 5. Performance Testing

Performance validation including:

- **Core Web Vitals**: FCP, LCP, CLS measurements
- **Load Time Testing**: Page load and interaction times
- **Resource Optimization**: Bundle size, image optimization
- **Memory Usage**: JavaScript heap size monitoring
- **Network Efficiency**: API request optimization

## Best Practices

### Test Data Management

- Use fixtures for consistent test data
- Mock API responses for reliable testing
- Clean up test data after each test
- Use unique identifiers to avoid conflicts

### Test Reliability

- Wait for elements to be visible before interacting
- Use proper selectors (data-testid attributes)
- Handle loading states and async operations
- Implement retry logic for flaky operations

### Performance Considerations

- Run tests in parallel when possible
- Use test sharding for large test suites
- Optimize test setup and teardown
- Cache dependencies and browser installations

### Debugging

- Use `page.pause()` to debug interactively
- Take screenshots at key points
- Log important information to console
- Use browser developer tools in headed mode

## CI/CD Integration

### GitHub Actions Workflow

The E2E tests are integrated into CI/CD pipeline with:

- **Automated Execution**: Tests run on push and pull requests
- **Parallel Execution**: Tests are sharded across multiple runners
- **Browser Matrix**: Tests run across multiple browsers
- **Artifact Collection**: Screenshots, videos, and reports are saved
- **Failure Notifications**: Automatic notifications on test failures

### Test Reporting

- **HTML Reports**: Interactive test reports with screenshots
- **JUnit Reports**: For integration with CI/CD systems
- **JSON Reports**: For custom reporting and analysis
- **Visual Comparisons**: Before/after screenshots for visual tests

## Maintenance

### Updating Tests

- Update test data when application changes
- Maintain visual baselines for regression tests
- Update selectors when UI changes
- Review and update performance thresholds

### Adding New Tests

1. Create test file in appropriate category
2. Use existing helpers and fixtures
3. Follow naming conventions
4. Add appropriate tags and descriptions
5. Update documentation

### Troubleshooting

Common issues and solutions:

- **Flaky Tests**: Add proper waits and retry logic
- **Selector Issues**: Use stable data-testid attributes
- **Performance Issues**: Optimize test setup and use sharding
- **Visual Differences**: Update baselines after intentional changes

## Monitoring and Metrics

### Test Metrics

- **Test Coverage**: Percentage of critical user journeys covered
- **Test Reliability**: Pass/fail rates and flakiness metrics
- **Execution Time**: Test duration and optimization opportunities
- **Browser Coverage**: Compatibility across different browsers

### Performance Metrics

- **Core Web Vitals**: FCP, LCP, CLS tracking over time
- **Load Times**: Page load performance trends
- **Resource Usage**: Bundle size and optimization tracking
- **User Experience**: Interaction responsiveness metrics

## Contributing

When adding new E2E tests:

1. Follow the existing test structure and patterns
2. Use the helper functions and fixtures provided
3. Add appropriate documentation and comments
4. Ensure tests are reliable and not flaky
5. Update this README if adding new test categories

For questions or issues with E2E testing, please refer to the [Playwright documentation](https://playwright.dev/) or create an issue in the project repository.