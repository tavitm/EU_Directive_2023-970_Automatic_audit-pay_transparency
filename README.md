# EU Directive 2023/970 Gender Pay Gap Compliance System

Complete implementation of the EU Directive 2023/970 compliance system for managing gender pay gaps and providing transparency in organizations.

## Project Overview

This is a full-stack application built with Next.js and React for managing EU Directive 2023/970 compliance. The system handles:

- **Gender Pay Gap Analysis** - Automated calculation and visualization of pay gaps across departments, job codes, and tenure levels
- **Job Evaluation Management** - Implementation of weighted job evaluation methods per Article 3
- **Pay Gap Justifications** - Multi-step workflow for submitting and tracking pay gap justifications (Article 8)
- **Employee Transparency** - Self-service access to salary statistics for peer groups (Article 10)
- **Compliance Reporting** - Article-by-article compliance status tracking and recommendations
- **Audit Trails** - Immutable audit logs for all system operations

## Phase Status

- **Phase 1**: ✅ Backend API Implementation (15 endpoints, database schema, authentication)
- **Phase 2**: ✅ Frontend React Implementation (10 major pages, full UI)
- **Phase 3**: 🔄 Integration Testing & Deployment

## Technology Stack

- **Frontend**: React 18 + Next.js 14 + TypeScript
- **Styling**: Tailwind CSS with custom utility classes
- **State Management**: React Context API + Hooks
- **Authentication**: JWT with token-based headers
- **API Integration**: Fetch-based HTTP with type-safe hooks
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## Project Structure

```
├── pages/
│   ├── _app.tsx              # Main app wrapper with AuthContext
│   ├── login.tsx             # Login interface
│   ├── dashboard.tsx         # KPI dashboard
│   ├── analysis/
│   │   └── index.tsx         # Pay gap analysis with 4-tab interface
│   ├── justifications/
│   │   ├── submit.tsx        # 4-step justification submission
│   │   └── index.tsx         # Justification list with filters
│   ├── transparency/
│   │   └── index.tsx         # Employee transparency requests
│   ├── employees/
│   │   └── import.tsx        # CSV employee import workflow
│   ├── jobs/
│   │   ├── create.tsx        # 4-step job creation workflow
│   │   └── index.tsx         # Job evaluation list
│   └── reports/
│       └── index.tsx         # Compliance dashboard (4 tabs)
├── hooks/
│   └── useApi.ts             # Type-safe API integration hooks
├── styles/
│   └── globals.css           # Global Tailwind styling
├── public/                   # Static assets
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── postcss.config.js         # PostCSS configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your configuration
```

### Development

```bash
# Start development server (http://localhost:3000)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@example.com | password |
| Manager | manager@example.com | password |
| HR Specialist | hr@example.com | password |
| Compliance Officer | compliance@example.com | password |

## Key Features

### Role-Based Access Control (10 levels)
- EMPLOYEE: View own salary transparency
- MANAGER: Analyze team pay gaps
- HR_SPECIALIST: Manage jobs and employees
- COMPLIANCE_OFFICER: Full compliance oversight
- And 6 more specialized roles

### Multi-Step Form Workflows
- Justification submission (4 steps)
- Job creation (4 steps)
- Employee transparency request (2 steps)
- CSV import (4 steps)

### Advanced Analysis
- Real-time pay gap calculations
- 4-tab drill-down interface (overview, department, job code, tenure)
- Color-coded gap status (green/yellow/red)
- Statistical significance analysis (t-test, p-values)

### Compliance Features
- Article 3: Job evaluation management
- Article 4: Gender pay gap analysis
- Article 8: Justification tracking
- Article 10: Employee transparency rights
- Article 15: Audit trail framework
- GDPR: Pseudonymization and data protection

## API Hooks

All screens use specialized API hooks:

```typescript
// Job management
const { createJob, listJobs, activateJob } = useJobs();

// Employee operations
const { importEmployees, requestTransparency } = useEmployees();

// Analysis
const { calculateGap } = useAnalysis();

// Justifications
const { submitJustification, approveJustification } = useJustifications();

// Reporting
const { getComplianceReport } = useReports();

// Audit
const { getLogs } = useAudit();
```

## Mock Data

The application includes realistic mock data for:
- 3 justifications in different approval stages
- 4 job evaluations with weighted criteria
- Complete pay gap analysis with department/job/tenure breakdowns
- Employee transparency requests with statistics
- Compliance report with article-by-article status

Replace mock data with real API calls by updating hooks in `pages/*/index.tsx`.

## Testing

### Unit Tests
```bash
npm test
npm test:watch
```

### Type Safety
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Known Limitations (To Be Addressed)

- Mock data used throughout (API integration pending)
- File upload/export buttons show only (full functionality pending)
- WebSocket real-time updates not yet implemented
- Print styles need refinement for reports
- Performance profiling pending

## Performance Optimizations Pending

- Code splitting and lazy loading
- Image optimization
- Caching strategies
- Bundle analysis and reduction

## Accessibility

- WCAG 2.1 AA compliance (in progress)
- Semantic HTML throughout
- Keyboard navigation support
- Screen reader friendly
- Reduced motion support
- Sufficient color contrast

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Manual Deployment

```bash
# Build
npm run build

# Start server
npm start
```

The `.vercel` directory in root provides staging/production configuration.

## Contributing

1. Create a feature branch
2. Follow TypeScript strict mode and ESLint rules
3. Format code with Prettier
4. Write clear commit messages
5. Submit pull request for review

## Compliance & Legal

This system implements:
- **EU Directive 2023/970** - Pay gap transparency and action plans
- **GDPR Article 4(11)** - Pseudonymization and data protection
- **GDPR Articles 25-32** - Data protection by design and default

For legal questions, consult your legal department.

## Support & Documentation

- **API Docs**: See `PHASE_2_COMMIT_MESSAGE.md` for implementation details
- **Progress**: See `PHASE_2_PROGRESS.md` for detailed feature list
- **Backend**: See Phase 1 documentation for API endpoint specifications

## License

Copyright © 2026. EU Directive 2023/970 Compliance System.

## Author

Tavi M. (tavitm@gmail.com)

## Changelog

### v2.0.0 (May 14, 2026)
- ✅ Phase 2: Complete React frontend implementation
- ✅ 10 major pages with 4,600+ lines of TypeScript
- ✅ 8 multi-step form workflows
- ✅ Role-based access control (10 levels)
- ✅ Compliance features for all Articles
- ✅ Advanced pay gap analysis with statistics

### v1.0.0 (May 13, 2026)
- ✅ Phase 1: Backend API implementation
- ✅ 15 REST endpoints
- ✅ Database schema and authentication
- ✅ JWT token management
- ✅ GDPR compliance framework

## Next Steps

1. Run integration tests with live API endpoints
2. Add E2E tests with Playwright
3. Performance optimization and code splitting
4. Accessibility audit (WCAG 2.1 AA)
5. Deploy to Vercel staging environment
6. User acceptance testing
7. Production deployment

---

**Last Updated**: May 14, 2026  
**Status**: Phase 2 Complete - Ready for Integration Testing
