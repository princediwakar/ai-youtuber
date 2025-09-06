# Multi-Account Format Video Generation System
## Implementation Plan & Progress Tracker

> **Project Goal**: Transform the fixed 5-frame MCQ system into a flexible, multi-format generation pipeline that creates different video structures optimized for each account's content type and audience.

---

## 📊 Implementation Progress

### Phase 1: Infrastructure Foundation
- [ ] Create format definition system (`lib/formats/`)
- [ ] Build dynamic frame service architecture
- [ ] Update database schema for format tracking
- [ ] Implement account-aware format selection logic
- [ ] Create format-specific prompt templates

### Phase 2: English Shots Account Enhancement
- [ ] Implement "Common Mistake" format (4 frames)
- [ ] Implement "Quick Fix" format (3 frames)
- [ ] Create English-specific layout system
- [ ] Build English-focused visual themes
- [ ] Test with 20% of English content generation

### Phase 3: Health Shots Account Enhancement
- [ ] Implement "Quick Tip" format (3 frames)
- [ ] Implement "Before/After" format (4 frames)
- [ ] Implement "Challenge" format (5 frames)
- [ ] Create health-specific layout system
- [ ] Test with 20% of health content generation

### Phase 4: Optimization & Analytics
- [ ] Cross-account format performance tracking
- [ ] Implement A/B testing between formats
- [ ] Account-specific format weight adjustments
- [ ] Advanced analytics and insights per format
- [ ] Full rollout based on performance data

---

## 🎯 Current System Analysis

### Multi-Account Architecture
- **English Shots Account** (`english_shots`)
  - Persona: `english_vocab_builder`
  - Content: Vocabulary quizzes for intermediate learners
  - Audience: Global English learners seeking fluency
  - Current Format: MCQ + True/False variations

- **Health Shots Account** (`health_shots`)
  - Personas: `brain_health_tips`, `eye_health_tips`
  - Content: Health tips and wellness advice
  - Audience: Health-conscious adults (25-55)
  - Current Format: MCQ + True/False variations

### Current Fixed Structure
```
Hook → Question → Answer → Explanation → CTA (5 frames)
```

### Problems to Solve
1. **Content Monotony**: Same structure across all videos
2. **Limited Engagement**: MCQ format is passive consumption
3. **Missed Opportunities**: Not leveraging YouTube Shorts best practices
4. **Account Limitations**: Same format doesn't suit different content types

---

## 🚀 New Format Specifications

### English Shots Account Formats

#### 1. Common Mistake Format (4 frames)
**Purpose**: Address common English errors with correction
**Engagement**: High (addresses pain points)
**Structure**:
```
Frame 1 (Hook): "Stop saying this word wrong!"
Frame 2 (Mistake): "99% say: [incorrect pronunciation/usage]"
Frame 3 (Correct): "Natives say: [correct version]"
Frame 4 (Practice): "Try it now! Repeat after me... + CTA"
```

#### 2. Quick Fix Format (3 frames)
**Purpose**: Instant vocabulary upgrades
**Engagement**: Medium-High (immediate value)
**Structure**:
```
Frame 1 (Hook): "Upgrade your English in 15 seconds"
Frame 2 (Problem): "Instead of saying [basic word]..."
Frame 3 (Solution): "Sound smarter with [advanced word] + CTA"
```

#### 3. Usage Demo Format (4 frames)
**Purpose**: Contextual word usage demonstration
**Engagement**: Medium (educational)
**Structure**:
```
Frame 1 (Hook): "When to use this advanced word"
Frame 2 (Wrong): "Don't use it here: [example]"
Frame 3 (Right): "Perfect usage: [example]"
Frame 4 (Practice): "Your turn to try! + CTA"
```

### Health Shots Account Formats

#### 1. Quick Tip Format (3 frames)
**Purpose**: Actionable health advice
**Engagement**: High (immediate practical value)
**Structure**:
```
Frame 1 (Hook): "This 30-second habit will boost your brain"
Frame 2 (Action): "Here's exactly what to do: [step by step]"
Frame 3 (Result): "Why it works + science behind it + CTA"
```

#### 2. Before/After Format (4 frames)
**Purpose**: Show transformation/consequences
**Engagement**: High (emotional connection)
**Structure**:
```
Frame 1 (Hook): "What happens to your eyes when you..."
Frame 2 (Before): "Most people damage their vision by..."
Frame 3 (After): "But if you do THIS instead..."
Frame 4 (Proof): "Here's the science + immediate action + CTA"
```

#### 3. Challenge Format (5 frames)
**Purpose**: Interactive brain/eye exercises
**Engagement**: Very High (participation)
**Structure**:
```
Frame 1 (Hook): "Test your brain with this challenge"
Frame 2 (Setup): "Try to remember these 5 items..."
Frame 3 (Challenge): [Display items for memory test]
Frame 4 (Reveal): "How did you do? Here's the trick..."
Frame 5 (CTA): "Follow for more brain training!"
```

---

## 🏗️ Technical Architecture

### 1. Format Definition System

#### Interface Structure
```typescript
interface ContentFormat {
  type: 'mcq' | 'common_mistake' | 'quick_fix' | 'usage_demo' | 'quick_tip' | 'before_after' | 'challenge'
  accountId: string
  persona: string
  frameCount: number
  frames: FormatFrame[]
  visualStyle: FormatVisualConfig
  timing: FrameTimingConfig
}

interface FormatFrame {
  type: 'hook' | 'mistake' | 'correct' | 'action' | 'result' | 'challenge' | 'reveal' | 'practice'
  content: string
  visualElements: FrameVisualElements
  duration: number
}

interface AccountFormatRules {
  [accountId: string]: {
    [persona: string]: {
      formats: string[]
      weights: { [format: string]: number }
      fallback: string
      brandingOverrides?: object
    }
  }
}
```

#### Format Selection Logic
```typescript
const formatRules: AccountFormatRules = {
  'english_shots': {
    'english_vocab_builder': {
      formats: ['mcq', 'common_mistake', 'quick_fix', 'usage_demo'],
      weights: { mcq: 0.4, common_mistake: 0.3, quick_fix: 0.2, usage_demo: 0.1 },
      fallback: 'mcq'
    }
  },
  'health_shots': {
    'brain_health_tips': {
      formats: ['mcq', 'quick_tip', 'before_after', 'challenge'],
      weights: { mcq: 0.4, quick_tip: 0.3, before_after: 0.2, challenge: 0.1 },
      fallback: 'mcq'
    },
    'eye_health_tips': {
      formats: ['mcq', 'quick_tip', 'before_after'],
      weights: { mcq: 0.5, quick_tip: 0.3, before_after: 0.2 },
      fallback: 'mcq'
    }
  }
}
```

### 2. Enhanced Generation Service

#### File Changes Required
- **`lib/generationService.ts`**: Add format-aware prompt generation
- **`lib/formats/`**: New directory for format definitions
- **`lib/prompts/`**: Format-specific prompt templates

#### New Functions Needed
```typescript
// Format selection
function selectFormatForContent(accountId: string, persona: string, topic: string): string

// Format-specific prompt generation
function generateFormatPrompt(format: string, accountId: string, persona: string, topic: string): string

// Dynamic content structure generation
function generateFormatContent(format: string, promptResponse: any): ContentFormat
```

### 3. Dynamic Frame Service

#### File Changes Required
- **`lib/frameService.ts`**: Dynamic frame count and layout routing
- **`lib/visuals/layouts/`**: New layout files for each format
- **`lib/visuals/formatThemes.ts`**: Account-specific format styling

#### New Layout Files Needed
```
lib/visuals/layouts/
├── mcqLayout.ts (existing)
├── commonMistakeLayout.ts (English)
├── quickFixLayout.ts (English)
├── usageDemoLayout.ts (English)
├── quickTipLayout.ts (Health)
├── beforeAfterLayout.ts (Health)
└── challengeLayout.ts (Health)
```

### 4. Database Schema Updates

#### New Tables/Columns
```sql
-- Add format tracking to existing quiz_jobs table
ALTER TABLE quiz_jobs ADD COLUMN format_type VARCHAR(50) DEFAULT 'mcq';
ALTER TABLE quiz_jobs ADD COLUMN frame_sequence JSONB;
ALTER TABLE quiz_jobs ADD COLUMN format_metadata JSONB;

-- New table for format performance tracking
CREATE TABLE format_analytics (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(255) REFERENCES quiz_jobs(id),
  account_id VARCHAR(100),
  persona VARCHAR(100),
  format_type VARCHAR(50),
  engagement_rate DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance queries
CREATE INDEX idx_format_analytics_lookup ON format_analytics(account_id, persona, format_type);
```

---

## 🚧 Implementation Phases

### Phase 1: Infrastructure Foundation (Week 1)
**Goal**: Build the core architecture for multi-format support

#### Day 1-2: Format Definition System
- [ ] Create `lib/formats/` directory structure
- [ ] Define TypeScript interfaces for format system
- [ ] Create format configuration files
- [ ] Build format selection algorithm

#### Day 3-4: Database & Schema
- [ ] Update database schema for format tracking
- [ ] Create migration scripts
- [ ] Update existing job creation to include format metadata
- [ ] Test database changes

#### Day 5-7: Generation Service Updates
- [ ] Modify `generatePrompt()` to be format-aware
- [ ] Create format-specific prompt templates
- [ ] Update content parsing and validation
- [ ] Test with existing MCQ format (no regression)

**Success Criteria**: 
- [ ] System can select formats based on account/persona
- [ ] Existing MCQ generation continues to work
- [ ] Database properly tracks format metadata

### Phase 2: English Shots Enhancement (Week 2)
**Goal**: Implement and test new formats for English learning content

#### Day 1-3: Common Mistake Format
- [ ] Create `commonMistakeLayout.ts`
- [ ] Implement Common Mistake prompt template
- [ ] Build 4-frame visual layout system
- [ ] Test with English vocabulary topics

#### Day 4-5: Quick Fix Format
- [ ] Create `quickFixLayout.ts`
- [ ] Implement Quick Fix prompt template
- [ ] Build 3-frame visual layout system
- [ ] Test vocabulary upgrade scenarios

#### Day 6-7: Testing & Optimization
- [ ] A/B test new formats vs MCQ (20% split)
- [ ] Monitor performance metrics
- [ ] Adjust format weights based on initial data
- [ ] Fix any visual or content issues

**Success Criteria**:
- [ ] Common Mistake format generates properly
- [ ] Quick Fix format creates engaging content
- [ ] No degradation in overall content quality
- [ ] Positive initial engagement metrics

### Phase 3: Health Shots Enhancement (Week 3)
**Goal**: Implement new formats for health content with emphasis on actionability

#### Day 1-2: Quick Tip Format
- [ ] Create `quickTipLayout.ts`
- [ ] Implement health-focused Quick Tip prompts
- [ ] Build action-oriented visual layout
- [ ] Test with brain and eye health topics

#### Day 3-4: Before/After Format
- [ ] Create `beforeAfterLayout.ts`
- [ ] Implement comparison-based prompts
- [ ] Build transformation visual layout
- [ ] Test health consequence scenarios

#### Day 5-6: Challenge Format
- [ ] Create `challengeLayout.ts`
- [ ] Implement interactive challenge prompts
- [ ] Build 5-frame engagement layout
- [ ] Test memory and vision exercises

#### Day 7: Integration & Testing
- [ ] A/B test health formats vs MCQ (20% split)
- [ ] Monitor health content engagement
- [ ] Cross-format performance analysis
- [ ] Bug fixes and optimization

**Success Criteria**:
- [ ] All three health formats generate correctly
- [ ] Health content shows improved engagement
- [ ] Format variety creates content diversity
- [ ] Account separation maintained

### Phase 4: Optimization & Full Rollout (Week 4)
**Goal**: Optimize format performance and prepare for full deployment

#### Day 1-3: Analytics & Insights
- [ ] Build format-specific analytics dashboard
- [ ] Implement cross-format performance comparisons
- [ ] Create account-specific insights
- [ ] Generate optimization recommendations

#### Day 4-5: Smart Format Selection
- [ ] Implement performance-based weight adjustments
- [ ] Create topic-to-format optimization mapping
- [ ] Build confidence-based format selection
- [ ] Test adaptive format distribution

#### Day 6-7: Full Rollout Preparation
- [ ] Conduct final testing across all formats
- [ ] Performance validation and stability testing
- [ ] Documentation and monitoring setup
- [ ] Gradual rollout to 50%, then 100%

**Success Criteria**:
- [ ] System intelligently selects optimal formats
- [ ] Overall engagement metrics improve
- [ ] Content diversity increases significantly
- [ ] System stability maintained

---

## 📈 Success Metrics & KPIs

### Engagement Metrics
- **Overall Engagement Rate**: Target 15% improvement
- **Format-Specific Engagement**: Track per format performance
- **Content Completion Rate**: Measure viewer retention
- **Interaction Rate**: Comments, likes, shares per format

### Content Quality Metrics
- **Generation Success Rate**: >95% for all formats
- **Content Appropriateness**: Manual review scores
- **Format Distribution**: Balanced variety across accounts
- **Error Rates**: <2% format generation failures

### Account Performance
- **English Shots**: Focus on retention and educational value
- **Health Shots**: Focus on engagement and practical application
- **Cross-Account Learning**: Insights transfer between accounts

### System Metrics
- **Generation Speed**: Maintain current performance
- **Resource Usage**: Monitor system resource impact
- **Scalability**: Support for additional formats/accounts
- **Reliability**: 99.9% uptime for generation system

---

## ⚠️ Risk Assessment & Mitigation

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| Format generation failures | Medium | High | Robust fallback to MCQ format |
| Performance degradation | Low | Medium | Gradual rollout with monitoring |
| Content quality issues | Medium | High | Enhanced validation and testing |
| Database migration issues | Low | High | Backup strategy and rollback plan |

### Business Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| Audience rejection of new formats | Medium | Medium | A/B testing and gradual introduction |
| Decreased engagement | Low | High | Performance monitoring and quick rollback |
| Account brand inconsistency | Low | Medium | Account-specific format rules |
| Increased complexity | High | Low | Comprehensive documentation and testing |

### Mitigation Strategies
1. **Gradual Rollout**: Start with 20% traffic to minimize risk
2. **Fallback Systems**: Always maintain MCQ as backup format
3. **Performance Monitoring**: Real-time metrics and alerting
4. **Quality Gates**: Validation at each implementation phase
5. **Rollback Plans**: Quick reversion capability for each phase

---

## 🎯 Next Steps

### Immediate Actions (This Week)
1. **Team Alignment**: Review and approve this implementation plan
2. **Resource Allocation**: Assign development tasks and timeline
3. **Environment Setup**: Prepare development and testing environments
4. **Baseline Metrics**: Establish current performance benchmarks

### Success Checkpoints
- [ ] **Week 1 Checkpoint**: Infrastructure foundation complete
- [ ] **Week 2 Checkpoint**: English formats deployed and tested
- [ ] **Week 3 Checkpoint**: Health formats deployed and tested  
- [ ] **Week 4 Checkpoint**: Full system optimization and rollout

### Long-term Vision
- **Month 2**: Add more sophisticated formats (interactive, multi-choice)
- **Month 3**: Implement AI-powered format optimization
- **Month 6**: Expand to additional accounts and content types
- **Year 1**: Full AI-driven experiment system with learned format preferences

---

## 📝 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-06 | 1.0 | Initial implementation plan created | Claude |

---

**Status**: 📋 Planning Phase  
**Next Review**: After Phase 1 completion  
**Owner**: Development Team  
**Priority**: High