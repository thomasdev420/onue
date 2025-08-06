import { supabase } from '../../supabaseClient';

export class IterationEngineService {
  constructor() {
    this.learningData = {
      successfulPatterns: [],
      failedPatterns: [],
      userPreferences: {},
      industryInsights: {}
    };
  }

  // Save learning data to database
  async saveLearningData(userId, learningData) {
    try {
      const { data, error } = await supabase
        .from('user_learning_data')
        .upsert({
          user_id: userId,
          learning_data: learningData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving learning data:', error);
      throw error;
    }
  }

  // Load learning data from database
  async loadLearningData(userId) {
    try {
      const { data, error } = await supabase
        .from('user_learning_data')
        .select('learning_data')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        this.learningData = data.learning_data;
      }
      
      return this.learningData;
    } catch (error) {
      console.error('Error loading learning data:', error);
      return this.learningData;
    }
  }

  // Analyze content performance and extract patterns
  analyzeContentPerformance(variation, performance, feedback) {
    const patterns = this.extractPatternsFromVariation(variation);
    
    if (performance > 0.7) {
      // Successful pattern
      this.learningData.successfulPatterns.push({
        variationType: variation.name,
        performance,
        feedback,
        timestamp: new Date().toISOString(),
        patterns: patterns
      });
    } else if (performance < 0.3) {
      // Failed pattern
      this.learningData.failedPatterns.push({
        variationType: variation.name,
        performance,
        feedback,
        timestamp: new Date().toISOString(),
        patterns: patterns
      });
    }

    return this.learningData;
  }

  // Extract patterns from content variation
  extractPatternsFromVariation(variation) {
    const patterns = [];
    
    variation.slides.forEach((slide, index) => {
      // Extract hooks
      if (slide.includes('🎯') || slide.includes('💡') || slide.includes('🚀')) {
        patterns.push({ 
          element: 'hook', 
          content: slide, 
          slideIndex: index,
          hookType: this.classifyHookType(slide)
        });
      }
      
      // Extract emotional triggers
      if (slide.includes('😤') || slide.includes('😰') || slide.includes('😎') || slide.includes('🎉')) {
        patterns.push({ 
          element: 'emotional_trigger', 
          content: slide, 
          slideIndex: index,
          emotionType: this.classifyEmotionType(slide)
        });
      }
      
      // Extract call-to-actions
      if (slide.includes('Join') || slide.includes('Revolution') || slide.includes('Transform')) {
        patterns.push({ 
          element: 'call_to_action', 
          content: slide, 
          slideIndex: index,
          ctaType: this.classifyCTAType(slide)
        });
      }
      
      // Extract social proof
      if (slide.includes('Thousands') || slide.includes('trust') || slide.includes('companies')) {
        patterns.push({ 
          element: 'social_proof', 
          content: slide, 
          slideIndex: index
        });
      }
      
      // Extract feature presentation
      if (slide.includes('POWERFUL') || slide.includes('PRECISION') || slide.includes('INNOVATION')) {
        patterns.push({ 
          element: 'feature_presentation', 
          content: slide, 
          slideIndex: index
        });
      }
    });
    
    return patterns;
  }

  // Classify hook types
  classifyHookType(slide) {
    if (slide.includes('Problem')) return 'problem_hook';
    if (slide.includes('Solution')) return 'solution_hook';
    if (slide.includes('Result')) return 'result_hook';
    if (slide.includes('Future')) return 'future_hook';
    return 'general_hook';
  }

  // Classify emotion types
  classifyEmotionType(slide) {
    if (slide.includes('😤') || slide.includes('😰')) return 'frustration';
    if (slide.includes('😎') || slide.includes('🎉')) return 'satisfaction';
    return 'neutral';
  }

  // Classify CTA types
  classifyCTAType(slide) {
    if (slide.includes('Join')) return 'inclusive';
    if (slide.includes('Revolution')) return 'disruptive';
    if (slide.includes('Transform')) return 'transformative';
    return 'general';
  }

  // Apply learning to generate improved content
  applyLearningToContent(businessData, variationType) {
    const successfulPatterns = this.learningData.successfulPatterns.filter(
      p => p.variationType === variationType && p.performance > 0.7
    );
    
    const failedPatterns = this.learningData.failedPatterns.filter(
      p => p.variationType === variationType && p.performance < 0.3
    );

    // Get successful hooks for this variation type
    const successfulHooks = successfulPatterns
      .flatMap(p => p.patterns.filter(pat => pat.element === 'hook'))
      .map(p => p.content);

    // Get failed patterns to avoid
    const failedHooks = failedPatterns
      .flatMap(p => p.patterns.filter(pat => pat.element === 'hook'))
      .map(p => p.content);

    return {
      successfulPatterns,
      failedPatterns,
      successfulHooks,
      failedHooks,
      learningApplied: successfulPatterns.length > 0 || failedPatterns.length > 0
    };
  }

  // Get performance insights
  getPerformanceInsights() {
    const totalFeedback = this.learningData.successfulPatterns.length + this.learningData.failedPatterns.length;
    
    if (totalFeedback === 0) return null;

    const averagePerformance = (
      this.learningData.successfulPatterns.reduce((sum, p) => sum + p.performance, 0) +
      this.learningData.failedPatterns.reduce((sum, p) => sum + p.performance, 0)
    ) / totalFeedback;

    const topPerformingVariation = this.learningData.successfulPatterns
      .sort((a, b) => b.performance - a.performance)[0];

    const mostCommonFeedback = this.getMostCommonFeedback();

    return {
      totalFeedback,
      averagePerformance,
      topPerformingVariation,
      mostCommonFeedback,
      improvementRate: this.calculateImprovementRate()
    };
  }

  // Get most common feedback themes
  getMostCommonFeedback() {
    const allFeedback = [
      ...this.learningData.successfulPatterns.map(p => p.feedback),
      ...this.learningData.failedPatterns.map(p => p.feedback)
    ].filter(f => f && f.trim() !== '');

    // Simple keyword analysis
    const feedbackKeywords = allFeedback.join(' ').toLowerCase().split(' ');
    const keywordCount = {};
    
    feedbackKeywords.forEach(keyword => {
      if (keyword.length > 3) {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      }
    });

    return Object.entries(keywordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));
  }

  // Calculate improvement rate
  calculateImprovementRate() {
    const recentPatterns = this.learningData.successfulPatterns
      .filter(p => new Date(p.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    const olderPatterns = this.learningData.successfulPatterns
      .filter(p => new Date(p.timestamp) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    if (olderPatterns.length === 0) return 0;

    const recentAvg = recentPatterns.length > 0 
      ? recentPatterns.reduce((sum, p) => sum + p.performance, 0) / recentPatterns.length 
      : 0;
    
    const olderAvg = olderPatterns.reduce((sum, p) => sum + p.performance, 0) / olderPatterns.length;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  // Reset learning data
  resetLearningData() {
    this.learningData = {
      successfulPatterns: [],
      failedPatterns: [],
      userPreferences: {},
      industryInsights: {}
    };
  }
}

export default new IterationEngineService(); 