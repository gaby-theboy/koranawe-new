import QuizCard from '../QuizCard'
import trafficSignsImage from '@assets/generated_images/Traffic_signs_module_thumbnail_8024bdd3.png'

export default function QuizCardExample() {
  return (
    <div className="p-6 max-w-2xl">
      <QuizCard
        questionNumber={1}
        totalQuestions={10}
        questionText="What does this traffic sign indicate?"
        questionImage={trafficSignsImage}
        choices={[
          { id: "1", text: "Stop and give way to all traffic", isCorrect: true },
          { id: "2", text: "Slow down and proceed with caution", isCorrect: false },
          { id: "3", text: "No entry for all vehicles", isCorrect: false },
          { id: "4", text: "Parking is prohibited", isCorrect: false },
        ]}
        onAnswer={(choiceId, isCorrect) => {
        }}
      />
    </div>
  )
}
