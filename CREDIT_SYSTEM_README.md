# Credit System Documentation

## Overview

The credit system is a comprehensive billing and usage tracking solution that manages user consumption of AI-powered features. Users spend credits based on their subscription tier and the specific actions they perform.

## Features

### 🎯 **Usage-Based Billing**
- Credits are consumed based on user actions
- Different subscription tiers have different credit costs per action
- Real-time credit balance tracking
- Monthly usage limits and rollover

### 📊 **Advanced Analytics**
- Detailed usage tracking by action type
- Monthly usage breakdowns
- Credit consumption history
- Usage percentage tracking

### 💳 **Flexible Pricing Tiers**
- **Free**: 50 credits/month, basic features
- **Starter**: 200 credits/month, $29/month
- **Scale**: 500 credits/month, $59/month  
- **Growth**: 1000 credits/month, $99/month

### 🔒 **Feature Access Control**
- Subscription-based feature access
- Credit-based action limits
- Automatic credit checking before actions
- Graceful handling of insufficient credits

## Database Schema

### Core Tables

#### `user_credits`
Tracks user credit balance and subscription information:
```sql
- user_id: TEXT (unique)
- credits_balance: INTEGER (current balance)
- credits_used_total: INTEGER (lifetime usage)
- subscription_tier: TEXT (free/starter/professional/enterprise)
- subscription_status: TEXT (active/cancelled/suspended/expired)
- subscription_start_date: TIMESTAMP
- subscription_end_date: TIMESTAMP
- auto_renew: BOOLEAN
```

#### `credit_usage`
Logs every credit-consuming action:
```sql
- user_id: TEXT
- action_type: TEXT (slide_generation, ai_chat, etc.)
- credits_consumed: INTEGER
- action_details: JSONB
- success: BOOLEAN
- error_message: TEXT
- created_at: TIMESTAMP
```

#### `credit_transactions`
Tracks credit purchases and adjustments:
```sql
- user_id: TEXT
- transaction_type: TEXT (purchase, bonus, refund, etc.)
- credits_amount: INTEGER
- payment_amount: DECIMAL
- payment_status: TEXT
- description: TEXT
```

#### `credit_pricing`
Configurable pricing and feature access:
```sql
- subscription_tier: TEXT
- monthly_credits: INTEGER
- monthly_price: DECIMAL
- credit_cost_per_action: JSONB
- features_enabled: JSONB
```

## Credit Costs by Action

| Action | Free | Starter | Scale | Growth |
|--------|------|---------|-------|---------|
| Slide Generation | 5 | 3 | 2 | 1 |
| AI Chat | 1 | 1 | 1 | 1 |
| Image Analysis | 2 | 1 | 1 | 1 |
| Visual Analysis | 3 | 2 | 1 | 1 |
| Content Creation | 3 | 2 | 1 | 1 |
| Memory Processing | 1 | 1 | 1 | 1 |
| Website Scraping | 2 | 1 | 1 | 1 |
| Brand Analysis | 2 | 1 | 1 | 1 |

## API Endpoints

### Credit Summary
```http
GET /api/credits/summary
```
Returns user's current credit balance, usage, and subscription info.

### Check Credits
```http
POST /api/credits/check
Content-Type: application/json

{
  "actionType": "slide_generation"
}
```
Checks if user has enough credits for a specific action.

### Consume Credits
```http
POST /api/credits/consume
Content-Type: application/json

{
  "actionType": "slide_generation",
  "success": true,
  "errorMessage": null
}
```
Consumes credits for a completed action.

### Usage History
```http
GET /api/credits/usage?limit=50&actionType=slide_generation
```
Returns user's credit usage history with optional filtering.

### Subscription Tiers
```http
GET /api/credits/tiers
```
Returns available subscription tiers and pricing.

## Frontend Integration

### React Hook
```javascript
import { useCredits } from '../shared/hooks/useCredits';

function MyComponent() {
  const {
    creditsBalance,
    subscriptionTier,
    checkCreditsForAction,
    consumeCreditsForAction,
    getActionCreditCost,
    hasFeatureAccess
  } = useCredits();

  // Check credits before action
  const handleSlideGeneration = async () => {
    const creditCheck = await checkCreditsForAction('slide_generation');
    if (!creditCheck.has_enough_credits) {
      alert(`Insufficient credits. Need ${creditCheck.action_cost} credits.`);
      return;
    }

    // Perform action
    const result = await generateSlides();
    
    // Consume credits after successful action
    await consumeCreditsForAction('slide_generation', true);
  };
}
```

### Credit Display Component
```javascript
import CreditDisplay from '../components/CreditDisplay';

// Compact display
<CreditDisplay compact={true} />

// Full display with details
<CreditDisplay showDetails={true} showUpgrade={true} />
```

## Backend Integration

### Service Layer
```javascript
import { creditService } from './creditService';

// Check credits before action
const creditCheck = await creditService.checkCreditsForAction(userEmail, 'slide_generation');
if (!creditCheck.has_enough_credits) {
  throw new Error('Insufficient credits');
}

// Consume credits after successful action
const result = await creditService.consumeCreditsForAction(userEmail, 'slide_generation', true);
```

### Unified Content Engine Integration
The credit system is integrated into the `UnifiedContentEngine`:

1. **Pre-action check**: Verifies user has enough credits before generation
2. **Post-action consumption**: Deducts credits after successful generation
3. **Error handling**: Consumes credits even for failed attempts (prevents abuse)

## Subscription Management

### Tier Features

#### Free Tier
- 50 credits/month
- Basic slide generation
- AI chat access
- Basic analytics

#### Starter Tier ($29/month)
- 200 credits/month
- Advanced slide generation
- Image analysis
- Priority support

#### Scale Tier ($59/month)
- 500 credits/month
- Visual analysis
- Memory system
- Bulk generation
- Advanced analytics

#### Growth Tier ($99/month)
- 1000 credits/month
- Team collaboration
- Custom branding
- API access
- All features

### Upgrade/Downgrade
- Users can upgrade anytime
- Downgrades take effect at next billing cycle
- Credits are prorated for mid-cycle changes

## Security & Validation

### Credit Validation
- All credit operations are validated at the database level
- Prevents negative credit balances
- Ensures proper credit consumption

### Rate Limiting
- Credit checks are cached to prevent abuse
- Database functions handle concurrent requests safely
- Usage tracking prevents excessive API calls

### Error Handling
- Graceful handling of insufficient credits
- Detailed error messages for users
- Fallback mechanisms for system failures

## Monitoring & Analytics

### Usage Metrics
- Real-time credit consumption tracking
- Monthly usage reports
- Action-specific usage breakdowns
- User behavior analytics

### Business Intelligence
- Revenue tracking by tier
- Feature usage patterns
- Credit consumption trends
- User retention metrics

## Implementation Checklist

### Database Setup
- [ ] Run `database_setup_credits.sql`
- [ ] Verify table permissions
- [ ] Test database functions
- [ ] Insert default pricing tiers

### Backend Integration
- [ ] Import credit service in API routes
- [ ] Add credit checks to AI endpoints
- [ ] Implement credit consumption
- [ ] Add error handling

### Frontend Integration
- [ ] Add credit display components
- [ ] Implement credit checking hooks
- [ ] Add upgrade CTAs
- [ ] Test credit flow

### Testing
- [ ] Test credit checking
- [ ] Test credit consumption
- [ ] Test insufficient credits
- [ ] Test subscription changes

## Troubleshooting

### Common Issues

#### Credits not updating
- Check database connection
- Verify user authentication
- Check for transaction errors

#### Insufficient credits error
- Verify user's subscription tier
- Check credit balance
- Review action costs

#### Usage not tracking
- Check credit_usage table
- Verify API endpoint calls
- Check for JavaScript errors

### Debug Commands
```sql
-- Check user credits
SELECT * FROM user_credits WHERE user_id = 'user@example.com';

-- Check recent usage
SELECT * FROM credit_usage WHERE user_id = 'user@example.com' ORDER BY created_at DESC LIMIT 10;

-- Check pricing
SELECT * FROM credit_pricing WHERE subscription_tier = 'professional';
```

## Future Enhancements

### Planned Features
- **Credit Bundles**: One-time credit purchases
- **Team Credits**: Shared credit pools
- **Usage Alerts**: Low credit notifications
- **Credit Gifting**: Transfer credits between users
- **Usage Analytics**: Advanced reporting dashboard

### Performance Optimizations
- **Credit Caching**: Redis-based credit balance caching
- **Batch Operations**: Bulk credit operations
- **Async Processing**: Background credit updates
- **Database Optimization**: Index improvements

---

This credit system provides a robust foundation for monetizing AI-powered features while ensuring fair usage and providing clear value to users at every subscription tier. 