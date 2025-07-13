import { 
  extractMemoryInsights, 
  storeMemoryInsights, 
  retrieveUserMemory,
  buildMemoryContext 
} from '../../services/aiMemoryService.js';

export async function GET(req) {
  try {
    const testUserEmail = 'test@memory.com';
    const testPrompt = "I want to create content like Nike's Just Do It campaign. My goal is to increase brand awareness. Target audience is young professionals aged 25-35.";
    
    console.log('Testing AI Memory System...');
    console.log('Test user email:', testUserEmail);
    console.log('Test prompt:', testPrompt);
    
    // Test 1: Extract memory insights
    console.log('\n1. Testing memory extraction...');
    const insights = extractMemoryInsights(testPrompt, {});
    console.log('Extracted insights:', insights);
    
    // Test 2: Store memory insights
    console.log('\n2. Testing memory storage...');
    const storeResult = await storeMemoryInsights(testUserEmail, insights);
    console.log('Storage result:', storeResult);
    
    // Test 3: Retrieve user memory
    console.log('\n3. Testing memory retrieval...');
    const memories = await retrieveUserMemory(testUserEmail);
    console.log('Retrieved memories:', memories);
    
    // Test 4: Build memory context
    console.log('\n4. Testing memory context building...');
    const memoryContext = buildMemoryContext(memories, testPrompt);
    console.log('Memory context:', memoryContext);
    
    return Response.json({
      success: true,
      test: {
        userEmail: testUserEmail,
        prompt: testPrompt,
        insights: insights,
        storageResult: storeResult,
        retrievedMemories: memories,
        memoryContext: memoryContext
      },
      summary: {
        insightsExtracted: insights.length,
        memoriesStored: storeResult.success ? storeResult.count : 0,
        memoriesRetrieved: memories.length,
        hasMemoryContext: memoryContext.length > 0
      }
    });
    
  } catch (error) {
    console.error('Memory system test failed:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 