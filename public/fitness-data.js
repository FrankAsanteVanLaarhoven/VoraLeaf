/* Curated starter movements, paraphrased from the linked NHS guidance.
 * Region labels support browsing; they do not quantify muscle activation.
 * No NHS photographs, illustrations or third-party video footage are copied.
 */
window.VORALEAF_FITNESS = {
  notice: 'Choose activity suitable for your circumstances. If unsure, ask a qualified health professional. Use a stable, non-wheeled chair where required. These examples are separate from coffee products and are not a personalised exercise prescription.',
  sourceAttribution: 'Movement descriptions paraphrased from NHS guidance; linked videos remain with their publishers. No endorsement of VORALEAF is implied.',
  categories: ['upper legs', 'lower legs', 'chest', 'upper arms', 'back', 'waist', 'neck'],
  exercises: [
    {
      id: 'starter-sit-to-stand', name: 'Sit-to-stand', bodyPart: 'upper legs', target: 'legs', equipment: 'chair', secondaryMuscles: [],
      description: 'A controlled transition from sitting to standing.',
      instructions: ['Begin near the chair’s front edge; position feet apart and incline forwards slightly.', 'Rise slowly, looking ahead, then lower yourself carefully.'],
      videoQuery: 'NHS sit to stand exercise', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-mini-squat', name: 'Supported mini-squat', bodyPart: 'upper legs', target: 'legs', equipment: 'chair', secondaryMuscles: [],
      description: 'A shallow, supported knee-bending movement.',
      instructions: ['Hold the chair back; separate your feet to hip width.', 'Keep your back straight, bend your knees comfortably, then straighten slowly.'],
      videoQuery: 'NHS mini squat exercise', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-calf-raise', name: 'Supported calf raise', bodyPart: 'lower legs', target: 'calves', equipment: 'chair', secondaryMuscles: [],
      description: 'A supported heel-lifting movement.',
      instructions: ['Steady yourself using the chair back.', 'Raise your heels within a comfortable range; lower them with control.'],
      videoQuery: 'NHS supported calf raises', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-wall-press', name: 'Wall press-up', bodyPart: 'chest', target: 'chest', equipment: 'wall', secondaryMuscles: [],
      description: 'An upright press against a wall.',
      instructions: ['Face the wall at arm’s length; place palms at chest level.', 'Keep your body straight, bend your elbows close to your sides, then press away.'],
      videoQuery: 'NHS wall press up exercise', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-biceps-curl', name: 'Light biceps curl', bodyPart: 'upper arms', target: 'biceps', equipment: 'dumbbell', secondaryMuscles: [],
      description: 'A light hand-weight curl.',
      instructions: ['Use light hand weights; keep your upper arms beside your body.', 'Bend your elbows to bring the weights towards your shoulders, then lower slowly.'],
      videoQuery: 'NHS biceps curl exercise light weights', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-seated-chest-stretch', name: 'Seated chest stretch', bodyPart: 'chest', target: 'chest', equipment: 'chair', secondaryMuscles: [],
      description: 'An upright, seated opening movement.',
      instructions: ['Sit clear of the backrest; ease your shoulders down and back, opening your arms sideways.', 'Move your chest gently forwards and upwards until a comfortable stretch is felt.'],
      videoQuery: 'NHS seated chest stretch', sourceUrl: 'https://www.nhs.uk/live-well/exercise/sitting-exercises/'
    },
    {
      id: 'starter-upper-body-twist', name: 'Seated upper-body twist', bodyPart: 'back', target: 'upper back', equipment: 'chair', secondaryMuscles: [],
      description: 'A gentle seated turning movement.',
      instructions: ['Sit tall with feet grounded; cross your arms towards opposite shoulders.', 'Keep your hips still while turning your torso comfortably left, then right.'],
      videoQuery: 'NHS seated upper body twist', sourceUrl: 'https://www.nhs.uk/live-well/exercise/sitting-exercises/'
    },
    {
      id: 'starter-hip-march', name: 'Seated hip march', bodyPart: 'upper legs', target: 'hips and thighs', equipment: 'chair', secondaryMuscles: [],
      description: 'Alternating seated knee lifts.',
      instructions: ['Sit upright without leaning back; hold the chair sides.', 'Lift one bent knee comfortably, place the foot down slowly, then alternate legs.'],
      videoQuery: 'NHS seated hip marching exercise', sourceUrl: 'https://www.nhs.uk/live-well/exercise/sitting-exercises/'
    },
    {
      id: 'starter-ankle-stretch', name: 'Seated ankle movement', bodyPart: 'lower legs', target: 'ankles', equipment: 'chair', secondaryMuscles: [],
      description: 'A seated point-and-flex movement.',
      instructions: ['Hold the chair sides and extend one leg with the foot lifted.', 'Point the toes away, then draw them back; change legs.'],
      videoQuery: 'NHS seated ankle stretch', sourceUrl: 'https://www.nhs.uk/live-well/exercise/sitting-exercises/'
    },
    {
      id: 'starter-side-bend', name: 'Standing sideways bend', bodyPart: 'waist', target: 'lower back', equipment: 'body weight', secondaryMuscles: [],
      description: 'A small standing side stretch.',
      instructions: ['Stand tall, feet apart and arms relaxed beside you.', 'Slide a hand down its side within a comfortable range; return upright and change sides.'],
      videoQuery: 'NHS standing sideways bend stretch', sourceUrl: 'https://www.nhs.uk/live-well/exercise/flexibility-exercises/'
    },
    {
      id: 'starter-calf-stretch', name: 'Wall-supported calf stretch', bodyPart: 'lower legs', target: 'calves', equipment: 'wall', secondaryMuscles: [],
      description: 'A supported split-stance stretch.',
      instructions: ['Place hands on a wall; bend the front knee and step the other leg back.', 'Keep the rear leg straight and heel grounded, then change legs.'],
      videoQuery: 'NHS wall calf stretch', sourceUrl: 'https://www.nhs.uk/live-well/exercise/flexibility-exercises/'
    },
    {
      id: 'starter-neck-rotation', name: 'Seated neck rotation', bodyPart: 'neck', target: 'neck', equipment: 'chair', secondaryMuscles: [],
      description: 'A comfortable seated head turn.',
      instructions: ['Sit tall with shoulders relaxed and look ahead.', 'Turn towards one shoulder without forcing the movement; return to centre and try the other side.'],
      videoQuery: 'NHS gentle neck rotation exercise', sourceUrl: 'https://www.nhs.uk/live-well/exercise/flexibility-exercises/'
    }
  ],
  videos: [
    {
      id: 'NL8IRKjLPf0', title: 'Standing press-up', channelTitle: 'NHS',
      exerciseIds: ['starter-wall-press'], bodyParts: ['chest', 'upper arms'],
      sourceUrl: 'https://www.youtube.com/watch?v=NL8IRKjLPf0'
    },
    {
      id: 'oLu9kwDzBdg', title: 'Try a general warm-up', channelTitle: 'NHS',
      embeddable: false, // Owner-disabled external playback observed 24 October 2026; retain provenance only.
      exerciseIds: ['starter-sit-to-stand', 'starter-mini-squat', 'starter-calf-raise', 'starter-wall-press', 'starter-biceps-curl', 'starter-seated-chest-stretch', 'starter-upper-body-twist', 'starter-hip-march', 'starter-ankle-stretch', 'starter-side-bend', 'starter-calf-stretch', 'starter-neck-rotation'],
      bodyParts: ['cardio'], sourceUrl: 'https://www.youtube.com/watch?v=oLu9kwDzBdg'
    },
    {
      id: 'GcPujVayIbI', title: 'Seated stretches: upper back and shoulders', channelTitle: 'Cambridge University Hospitals NHS Foundation Trust',
      exerciseIds: ['starter-seated-chest-stretch', 'starter-upper-body-twist'], bodyParts: ['back', 'shoulders', 'chest'],
      sourceUrl: 'https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/'
    },
    {
      id: 'IB-8SWyylME', title: 'Seated stretches: back and thighs', channelTitle: 'Cambridge University Hospitals NHS Foundation Trust',
      exerciseIds: ['starter-upper-body-twist', 'starter-side-bend', 'starter-sit-to-stand'], bodyParts: ['back', 'upper legs', 'waist'],
      sourceUrl: 'https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/'
    },
    {
      id: 'Kvcc_DhFoeg', title: 'Seated stretches: thighs and calves', channelTitle: 'Cambridge University Hospitals NHS Foundation Trust',
      exerciseIds: ['starter-calf-stretch', 'starter-calf-raise', 'starter-mini-squat'], bodyParts: ['upper legs', 'lower legs'],
      sourceUrl: 'https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/'
    },
    {
      id: 'Q14tE13GNrs', title: 'Seated stretches: neck', channelTitle: 'Cambridge University Hospitals NHS Foundation Trust',
      exerciseIds: ['starter-neck-rotation'], bodyParts: ['neck'],
      sourceUrl: 'https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/'
    }
  ]
};
