import { api } from './api';
import { 
  DashboardProgressModel, 
  DashboardTopic, 
  DashboardSubjectSummary,
  Grade,
  Subject,
  Chapter,
  Topic,
  TopicStatus,
  SubjectSummary
} from '../types';

export function formatSkillLabel(label: string): string {
  if (!label) return '';
  return label
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getTopicMasteryCategory(topic: DashboardTopic): "weak" | "practice" | "mastered" | "improving" | "not_started" {
  if (
    topic.latest_score !== null &&
    topic.latest_score < 40
  ) {
    return "weak";
  }

  if (topic.completion_status === "needs_practice") {
    return "practice";
  }

  if (
    topic.completion_status === "completed" &&
    (topic.best_score ?? 0) >= 80
  ) {
    return "mastered";
  }

  if (topic.completion_status === "completed") {
    return "improving";
  }

  return "not_started";
}

export function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

export async function loadDashboardProgress(): Promise<DashboardProgressModel> {
  try {
    // 1. Load User (Verify authentication implicitly)
    await api.getMe();

    // 2. Load Grades
    const grades: Grade[] = await api.getGrades();
    
    // Flattened results for topics and summaries
    const allTopics: DashboardTopic[] = [];
    const allSubjectSummaries: DashboardSubjectSummary[] = [];

    // Process grades in parallel safely
    await Promise.all(grades.map(async (grade) => {
      // 3. Load Subjects for each grade
      const subjects: Subject[] = await api.getSubjects(grade.id);
      
      await Promise.all(subjects.map(async (subject) => {
        // 7. Load Subject Summary (requested later in flow but can be done here)
        let subjectSummary: SubjectSummary | null = null;
        try {
          subjectSummary = await api.getSubjectSummary(subject.id);
        } catch (e) {
          console.warn(`Failed to load summary for subject ${subject.id}`, e);
        }

        if (subjectSummary) {
          allSubjectSummaries.push({
            subject_id: subject.id,
            total_topics: subjectSummary.total_topics,
            completed_topics: subjectSummary.completed_topics,
            is_completed: subjectSummary.completion_percentage === 100,
            strength_labels: subjectSummary.strengths || [],
            weakness_labels: subjectSummary.weaknesses || []
          });
        }

        // 4. Load Chapters
        const chapters: Chapter[] = await api.getChapters(subject.id);
        
        await Promise.all(chapters.map(async (chapter) => {
          // 5. Load Topics
          const topics: Topic[] = await api.getTopics(chapter.id);
          
          await Promise.all(topics.map(async (topic) => {
            // 6. Load Topic Status
            let topicStatus: TopicStatus | null = null;
            try {
              topicStatus = await api.getTopicStatus(topic.id);
            } catch (e) {
              // Graceful failure as requested
              topicStatus = {
                topic_id: topic.id,
                status: 'not_started',
                completion_percentage: 0,
                last_test_score: undefined,
                strengths: [],
                weaknesses: []
              };
            }

            allTopics.push({
              grade_id: grade.id,
              grade_name: grade.name,
              subject_id: subject.id,
              subject_name: subject.name,
              chapter_id: chapter.id,
              chapter_title: chapter.title,
              topic_id: topic.id,
              topic_title: topic.title,
              topic_description: topic.description,
              learning_objective: topic.learning_objective,
              completion_status: topicStatus.status || 'not_started',
              latest_score: topicStatus.last_test_score ?? null,
              best_score: topicStatus.last_test_score ?? null, // Backend only tracks latest for now
              strength_labels: topicStatus.strengths || [],
              weakness_labels: topicStatus.weaknesses || [],
              show_checkmark: topicStatus.status === 'completed'
            });
          }));
        }));
      }));
    }));

    // Post-process to build final DashboardProgressModel
    const completedTopics = allTopics.filter(t => t.completion_status === "completed");
    const needsPracticeTopics = allTopics.filter(t => t.completion_status === "needs_practice");
    const notStartedTopics = allTopics.filter(t => t.completion_status === "not_started");
    
    // Categories for mastery matrix
    const masteredTopics = allTopics.filter(t => getTopicMasteryCategory(t) === "mastered");
    const improvingTopics = allTopics.filter(t => getTopicMasteryCategory(t) === "improving");
    const practiceTopics = allTopics.filter(t => getTopicMasteryCategory(t) === "practice");
    const weakTopics = allTopics.filter(t => getTopicMasteryCategory(t) === "weak");

    // Collect all unique strengths/weaknesses
    let allStrengths: string[] = [];
    let allWeaknesses: string[] = [];

    allTopics.forEach(t => {
      allStrengths.push(...t.strength_labels);
      allWeaknesses.push(...t.weakness_labels);
    });

    allSubjectSummaries.forEach(s => {
      allStrengths.push(...s.strength_labels);
      allWeaknesses.push(...s.weakness_labels);
    });

    return {
      topics: allTopics,
      subjectSummaries: allSubjectSummaries,
      totalTopics: allTopics.length,
      completedTopics: completedTopics.length,
      needsPracticeTopics,
      notStartedTopics,
      masteredTopics,
      improvingTopics,
      practiceTopics,
      weakTopics,
      strengths: uniqueStrings(allStrengths),
      weaknesses: uniqueStrings(allWeaknesses)
    };

  } catch (error) {
    console.error("Dashboard loading failed:", error);
    throw error;
  }
}
