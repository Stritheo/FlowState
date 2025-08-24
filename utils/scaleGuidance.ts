export interface ScaleGuidanceContent {
  title: string;
  content: string;
}

export function getEnergyScaleGuidance(): ScaleGuidanceContent {
  return {
    title: "Energy Level Scale",
    content: `Rate your current energy level:

1-2: Low Energy
• Tired, drained, sluggish
• Difficulty focusing or staying alert
• Need rest or rejuvenation

3-5: Balanced Energy
• Calm, steady, sustainable
• Optimal performance zone
• Clear thinking and good focus

6-7: High Energy
• Energized, excited, stimulated
• May feel scattered or restless
• Could benefit from grounding activities`
  };
}

export function getFocusScaleGuidance(): ScaleGuidanceContent {
  return {
    title: "Focus Level Scale",
    content: `Rate your current focus level:

1-2: Low Focus
• Scattered, distracted thoughts
• Difficulty concentrating
• Mind feels foggy or unclear

3-5: Balanced Focus
• Clear, directed attention
• Optimal performance zone
• Good mental clarity

6-7: High Focus
• Intense concentration
• May feel tunnel vision
• Could be hyper-focused on details`
  };
}

export function getGeneralScaleGuidance(): ScaleGuidanceContent {
  return {
    title: "1-7 Scale Guide",
    content: `Understanding the scale ranges:

1-2: LOW ZONE
• Tired, disconnected, need recovery
• Time for rest, self-care, or gentle activities

3-5: FLOW ZONE
• Balanced, optimal performance
• Best for important work and decision-making
• Sustainable and productive state

6-7: HIGH ZONE
• Intense, potentially scattered
• Good for physical activities or creative bursts
• May need grounding or calming practices

The sweet spot (3-5) is where energy and focus align for peak performance.`
  };
}