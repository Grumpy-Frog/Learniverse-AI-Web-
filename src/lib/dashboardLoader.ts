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

export type TopicMasteryCategory = "weak" | "practice" | "improving" | "mastered" | "not_started";

export function getTopicMasteryCategory(topic: DashboardTopic): TopicMasteryCategory {
  const latest = topic.latest_score;
  const best = topic.best_score;

  if (
    topic.completion_status === "needs_practice" &&
    latest !== null &&
    latest < 40
  ) {
    return "weak";
  }

  if (
    latest !== null &&
    latest < 40
  ) {
    return "weak";
  }

  if (topic.completion_status === "needs_practice") {
    return "practice";
  }

  if (
    topic.completion_status === "completed" &&
    (best ?? latest ?? 0) >= 80
  ) {
    return "mastered";
  }

  if (topic.completion_status === "completed") {
    return "improving";
  }

  return "not_started";
}

export function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

export function collectStrengths(
  topics: DashboardTopic[],
  subjectSummaries: DashboardSubjectSummary[]
): string[] {
  return uniqueStrings([
    ...topics.flatMap((topic) => topic.strength_labels ?? []),
    ...subjectSummaries.flatMap((summary) => summary.strength_labels ?? []),
  ]);
}

export function collectWeaknesses(
  topics: DashboardTopic[],
  subjectSummaries: DashboardSubjectSummary[]
): string[] {
  return uniqueStrings([
    ...topics.flatMap((topic) => topic.weakness_labels ?? []),
    ...subjectSummaries.flatMap((summary) => summary.weakness_labels ?? []),
  ]);
}

export function collectNeedsPracticeTopics(topics: DashboardTopic[]): DashboardTopic[] {
  return topics.filter((topic) => topic.completion_status === "needs_practice");
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
        // 7. Load Subject Summary
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
              best_score: topicStatus.last_test_score ?? null, 
              strength_labels: topicStatus.strengths || [],
              weakness_labels: topicStatus.weaknesses || [],
              show_checkmark: topicStatus.status === 'completed'
            });
          }));
        }));
      }));
    }));

    // Post-process to build final DashboardProgressModel
    const needsPracticeTopics = collectNeedsPracticeTopics(allTopics);
    
    // Categories for mastery matrix
    const masteredTopics = allTopics.filter(t => getTopicMasteryCategory(t) === "mastered");
    const improvingTopics = allTopics.filter(t => getTopicMasteryCategory(t) === "improving");
    const practiceTopics = allTopics.filter(t => getTopicMasteryCategory(t) === "practice");
    const weakTopics = allTopics.filter(t => getTopicMasteryCategory(t) === "weak");

    return {
      topics: allTopics,
      subjectSummaries: allSubjectSummaries,
      totalTopics: allTopics.length,
      completedTopics: allTopics.filter(t => t.completion_status === "completed").length,
      needsPracticeTopics,
      notStartedTopics: allTopics.filter(t => t.completion_status === "not_started"),
      masteredTopics,
      improvingTopics,
      practiceTopics,
      weakTopics,
      strengths: collectStrengths(allTopics, allSubjectSummaries),
      weaknesses: collectWeaknesses(allTopics, allSubjectSummaries)
    };


  } catch (error) {
    console.error("Dashboard loading failed:", error);
    throw error;
  }
}
