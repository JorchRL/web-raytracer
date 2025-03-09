# Retrospective: LLM-Assisted WebGPU Raytracer Development

## From Purple Screens to Cornell Boxes: A Journey in Collaborative AI Development

This retrospective explores the process of developing a WebGPU raytracer using LLM-assisted development, with a particular focus on debugging complex graphics issues and creating a visual testing pipeline. Rather than a formal technical report, this document captures the experience, insights, and potential of this development approach.

## The Structured Development Approach

Our development of the WebGPU Interactive Raytracer followed a methodical, phased approach guided by a detailed implementation plan that broke down the process into specific, manageable stages. This structured approach was crucial for working effectively with LLMs.

### Stage 1: Core Raytracer Implementation

The project began with foundational work across six phases:

1. **Project Scaffolding**: We started by creating the basic structure of the application—HTML for the UI, JavaScript for DOM interactions, and stubs for GPU initialization and rendering functions.

2. **GPU Initialization and Preview Pipeline**: We implemented WebGPU initialization to request a GPU adapter and device, along with a basic rasterization pipeline for preview mode.

3. **Basic Raytracing Engine**: We developed the core raytracing engine with abstractions for rays, intersections, materials, and geometry, implementing fundamental ray-scene intersection logic.

4. **Scene and Camera Management**: We added interactive scene and camera controls, allowing users to modify the scene and navigate within it.

5. **Testing Integration**: We created a streamlined test suite using Vitest, with a focus on rapid feedback cycles.

6. **Iterative Improvement**: We established a review process to identify and address issues through quick iterations.

### Stage 2: Enhanced Features

After establishing the core functionality, we moved to enhanced features:

7. **Auto-loading Preview with Cornell Box**: This critical phase involved creating a standard Cornell box scene that would automatically display when the application loads—the focus of our debugging journey.

8. **Basic Lighting and Shadows**: We implemented lighting calculations and shadow rays for more realistic rendering.

9. **Material Enhancements**: We added support for reflective and transparent materials, along with a material editor UI.

This phased approach provided clear objectives for each development stage and facilitated effective collaboration with the LLM by breaking complex tasks into manageable chunks with specific prompts. Each phase built upon previous work, ensuring cohesive development.

### The LLM Collaboration Model

A key aspect of our approach was tailoring LLM usage to the task at hand:

- **Simpler scaffolding tasks** (like project setup and UI work) used more lightweight models like o3-mini.
- **Complex algorithmic challenges** (such as the raytracing engine and material system) leveraged more sophisticated models like Claude 3.7 Sonnet.

Each phase had a carefully crafted prompt that provided just enough context and constraints while leaving room for the LLM to apply its capabilities. This balanced guidance with creative problem-solving, resulting in code that aligned with our architectural vision while benefiting from the LLM's insights.

## The Journey: Debugging Without Seeing

One of the most fascinating aspects of our development experience was solving a rendering problem where the output was "invisible." We had a raytracer that was technically functioning correctly—as evidenced by the logs showing ray hit calculations and proper scene initialization—but the rendered output was just a solid purple screen for preview mode and a black screen for raytracing mode.

### The Key Insight: Specific Debugging Feedback Loops

The breakthrough came when we implemented a multi-layered approach to debugging:

1. **Detailed Console Logging**: Adding explicit logging of scene objects, camera positions, rendering progression, and hit/miss statistics provided crucial insight that would have been difficult to gain through traditional debugging.

2. **Overlay Visualization**: Creating a separate canvas overlay to visualize the scene structure when the main WebGPU canvas couldn't display properly was instrumental in understanding the scene geometry.

3. **Progressive Hypothesis Testing**: Each debugging step built on the information from the previous one, leading to the discovery of the core issue: the WebGPU texture usage flags weren't configured to allow writing pixel data.

The solution was remarkably simple once identified (adding `GPUTextureUsage.COPY_DST` to the configuration), but finding it required this layered feedback approach.

## Visual Testing: Seeing Through the AI's Eyes

Perhaps the most innovative aspect of our development was creating a visual testing pipeline that not only captured screenshots but also analyzed them using computer vision AI (Gemini via OpenRouter). This created a fascinating meta-layer where:

1. We built a raytracer (AI-assisted)
2. Created visual tests to capture screenshots (AI-assisted)
3. Used another AI to "see" and describe the renders (Gemini)
4. All to validate that our rendering worked correctly

This approach has profound implications. Traditionally, visual validation requires human eyes, but we effectively "taught" an AI to be our eyes and validate the renders. The pipeline provides detailed descriptions of what appears in each render, creating an automated visual regression system that understands the semantic content of images, not just pixel-perfect comparisons.

## The "Vibe TDD" Approach

What emerged during this process could be called "Vibe TDD" - a more intuitive, feedback-rich form of Test-Driven Development that:

1. **Prioritizes rich, qualitative feedback** over binary pass/fail assertions
2. **Embraces multiple layers of validation** (logs, visual overlays, AI analysis)
3. **Adapts tests based on emerging understanding** rather than rigid up-front specifications

Unlike traditional TDD, which often requires precise specifications up front, Vibe TDD allows for exploration and discovery while still maintaining the discipline of verification. The tests evolve alongside the understanding of the problem.

## From Plan to Reality: The Evolution of the Development Process

An interesting aspect of our project was how the actual development process evolved from the initial plan. While the implementation plan provided a valuable roadmap, the reality of development introduced unforeseen challenges:

1. **Shifting Priorities**: The Cornell Box implementation (Phase 7) became a critical focus point, as it served as an ideal test case for debugging rendering issues.

2. **Unexpected Technical Hurdles**: The seemingly simple task of displaying rendered output uncovered subtle complexities in WebGPU's texture handling that weren't anticipated in the original plan.

3. **Emergent Testing Needs**: The plan emphasized traditional unit testing, but our work revealed the need for sophisticated visual testing approaches that weren't initially considered.

This evolution highlights a strength of LLM-assisted development: the ability to adapt and pivot based on emerging needs without losing sight of the overall architectural vision. The implementation plan provided needed structure, but the development process remained flexible enough to address challenges as they arose.

## Benefits of LLM-Assisted Development

This experience highlighted several key benefits:

1. **Complex Problem Solving**: LLMs excel at suggesting multi-faceted solutions to complex problems, especially when there are multiple potential root causes.

2. **Expansive Context Awareness**: The LLM could hold in memory the full context of the codebase, logs, and previous attempts, synthesizing all this information to generate new hypotheses.

3. **Rapid Iteration Cycles**: Development progressed through many micro-iterations, each building on insights from the previous cycle.

4. **Reduced Cognitive Load**: The LLM handled many implementation details, allowing the human developer to focus on evaluating approaches and results.

5. **Novel Solution Generation**: The combination of visual debugging overlays with AI-powered screenshot analysis was a creative solution that might not have emerged in a traditional development process.

6. **Balanced Structure and Flexibility**: The phased approach provided needed structure, while the LLM collaboration allowed for creative problem-solving within that structure.

## Caveats and Challenges

Despite the success, there were challenges:

1. **Feedback Quality Is Critical**: The LLM could only reason effectively with high-quality input. Vague descriptions of problems led to vague solutions.

2. **Hidden Assumptions**: Sometimes the LLM made assumptions about the codebase or WebGPU functionality that weren't explicitly validated.

3. **Diagnostic Overhead**: The extensive logging and visualization added code complexity that wouldn't be needed in a production version.

4. **Novel Error Types**: Some errors (like the WebGPU texture usage configuration) were specific to newer technologies and required specialized knowledge.

5. **Plan Adherence vs. Flexibility**: Balancing adherence to the implementation plan with the flexibility to address emerging issues required thoughtful management.

## Practical Guidelines for Developers

For developers interested in this approach, here are some practical guidelines:

1. **Start with a Structured Plan**: Break down complex projects into phases with clear objectives, as we did in our implementation plan.

2. **Match LLM to Task Complexity**: Use simpler models for straightforward tasks and more sophisticated models for complex problems.

3. **Be Specific About Symptoms**: Describe exactly what you're seeing (or not seeing), including console output and behavior.

4. **Share Context Aggressively**: Logs, error messages, and even screenshots give the LLM crucial context.

5. **Build Layered Debugging Tools**: Create multiple views into your system's behavior (logs, visualizations, state dumps).

6. **Leverage Meta-AI Testing**: Use AI tools to analyze outputs and provide feedback, creating rich verification systems.

7. **Embrace Rapid Iterations**: Let the development process flow through many small cycles rather than fewer large ones.

8. **Capture Learning Artifacts**: Documentation like this retrospective captures insights that can inform future development.

9. **Allow for Plan Evolution**: Recognize when to adapt the implementation plan based on emerging insights and challenges.

## The Future of "Vibe TDD"

Looking ahead, there's enormous potential to formalize and expand this approach:

1. **Integrated AI-Visual Testing Frameworks**: Frameworks could emerge that automatically capture visual outputs and provide AI-powered descriptions and validations.

2. **Semantic Test Assertions**: Instead of pixel-perfect comparisons, tests could make assertions about the semantic content of renders ("contains a blue reflective sphere").

3. **Multi-Modal Development Environments**: Future IDEs could integrate these feedback loops directly, with real-time AI analysis of program outputs.

4. **Emergent Test Generation**: As the system evolves, AI could propose new tests based on observed behavior and edge cases.

5. **AI-Enhanced Project Planning**: Future development might use AI to generate and refine implementation plans that anticipate potential issues.

## Conclusion: High-Quality Feedback Is the Key

The most critical insight from this experience is that high-quality, specific feedback is the foundation of effective LLM-assisted development. The LLM thrives when given rich, detailed information about the system's behavior, enabling it to reason about complex problems and propose targeted solutions.

This approach doesn't replace traditional software engineering principles—it enhances them. The discipline of testing, the importance of debugging tools, and the need for systematic problem-solving remain essential. What changes is how we apply these principles, leveraging AI to extend our capabilities and create more rich, informative feedback loops.

The WebGPU raytracer project demonstrates that complex graphics programming challenges can be effectively addressed through this collaborative approach, resulting in innovative solutions like our AI-powered visual testing pipeline. As LLMs continue to evolve, this style of development—rich in feedback, iterative in nature, and supported by multiple layers of validation—may become a standard approach to solving complex software engineering challenges.

In the end, the Cornell Box wasn't just a demonstration of raytracing—it was a demonstration of how humans and AI can collaborate to solve problems neither could easily solve alone. 