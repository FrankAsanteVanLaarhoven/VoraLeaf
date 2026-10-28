/* Curated starter movements, paraphrased from the linked NHS guidance.
 * Region labels support browsing; they do not quantify muscle activation.
 * No NHS photographs, illustrations or third-party video footage are copied.
 */
window.VORALEAF_FITNESS = {
  notice: 'Choose activity suitable for your circumstances. If unsure, ask a qualified health professional. Use a stable, non-wheeled chair where required. These examples are separate from coffee products and are not a personalised exercise prescription.',
  sourceAttribution: 'Movement descriptions paraphrased from NHS guidance; linked videos remain with their publishers. No endorsement of VORALEAF is implied.',
  categories: ['chest', 'back', 'shoulders', 'upper legs', 'lower legs', 'upper arms', 'lower arms', 'waist', 'cardio', 'neck'],
  exercises: [
    {
      id: 'starter-barbell-bench-press', name: 'Barbell bench press', bodyPart: 'chest', target: 'pectorals', equipment: 'barbell', secondaryMuscles: ['anterior deltoids', 'triceps'],
      description: 'A foundational horizontal gym press for upper-body strength and chest development.',
      instructions: ['Lie flat on the gym bench with your eyes beneath the barbell, feet planted firmly on the floor and shoulder blades drawn together.', 'Unrack the bar with a balanced grip slightly wider than shoulder width, lower with control to mid-chest, then press smoothly back to lockout.'],
      videoQuery: 'barbell bench press exercise technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-barbell-back-squat', name: 'Barbell back squat', bodyPart: 'upper legs', target: 'quadriceps and glutes', equipment: 'barbell', secondaryMuscles: ['hamstrings', 'core', 'lower back'],
      description: 'A compound gym rack squat targeting the quadriceps, glutes and core stability.',
      instructions: ['Rest the barbell securely across your upper traps inside the squat rack, step back and set your feet shoulder-width apart with toes slightly turned out.', 'Brace your core, sit your hips back and down until thighs reach parallel, then drive through your mid-foot to stand tall.'],
      videoQuery: 'barbell squat exercise technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-barbell-deadlift', name: 'Romanian barbell deadlift', bodyPart: 'back', target: 'posterior chain and hamstrings', equipment: 'barbell', secondaryMuscles: ['glutes', 'erector spinae', 'forearms'],
      description: 'A controlled hip-hinge barbell movement for posterior chain power and hamstring resilience.',
      instructions: ['Stand tall holding the barbell at hip height with a pronated shoulder-width grip and soft knees.', 'Hinge at the hips while keeping your spine neutral and the bar close to your shins until you feel a deep hamstring stretch, then drive your hips forwards to return upright.'],
      videoQuery: 'romanian deadlift barbell technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-machine-lat-pulldown', name: 'Leverage machine lat pulldown', bodyPart: 'back', target: 'latissimus dorsi', equipment: 'leverage machine', secondaryMuscles: ['biceps', 'rhomboids', 'rear deltoids'],
      description: 'A controlled vertical gym pull for upper-back width and scapular control.',
      instructions: ['Secure your thighs beneath the machine pad and take a wide overhand grip on the overhead bar.', 'Depress your shoulder blades first, pull the bar smoothly towards your upper chest while keeping your torso steady, then control the return to full extension.'],
      videoQuery: 'lat pulldown gym exercise technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-dumbbell-shoulder-press', name: 'Overhead dumbbell shoulder press', bodyPart: 'shoulders', target: 'deltoids', equipment: 'dumbbell', secondaryMuscles: ['triceps', 'upper trapezius', 'core'],
      description: 'An overhead gym press building balanced shoulder strength and overhead stability.',
      instructions: ['Sit on an upright bench or stand tall holding a pair of dumbbells at shoulder level with palms facing forwards or slightly neutral.', 'Brace your midsection, press the dumbbells overhead until arms are aligned by your ears, then lower slowly back to shoulder height.'],
      videoQuery: 'dumbbell shoulder press exercise technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-cable-seated-row', name: 'Seated cable row', bodyPart: 'back', target: 'mid-back and rhomboids', equipment: 'cable', secondaryMuscles: ['latissimus dorsi', 'biceps', 'rear deltoids'],
      description: 'A horizontal cable pull for posture, back thickness and shoulder-blade retraction.',
      instructions: ['Sit tall at the cable row station with knees slightly bent and grasp the handle with arms extended.', 'Draw your elbows back past your ribs while squeezing your shoulder blades together, pause briefly at the abdomen, then extend your arms with control.'],
      videoQuery: 'seated cable row exercise technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-kettlebell-swing', name: 'Two-handed kettlebell swing', bodyPart: 'cardio', target: 'posterior chain and conditioning', equipment: 'kettlebell', secondaryMuscles: ['glutes', 'hamstrings', 'core', 'shoulders'],
      description: 'A dynamic gym conditioning movement combining explosive hip drive with cardiovascular stamina.',
      instructions: ['Stand with feet slightly wider than hip width and hike the kettlebell back between your thighs with a flat back.', 'Snap your hips forwards explosively to float the kettlebell to chest height while keeping arms relaxed, then let it swing back into the next hip hinge.'],
      videoQuery: 'kettlebell swing exercise technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-machine-leg-press', name: 'Seated leg press machine', bodyPart: 'upper legs', target: 'quadriceps and glutes', equipment: 'leverage machine', secondaryMuscles: ['hamstrings', 'calves'],
      description: 'A guided gym sled press for controlled lower-body hypertrophy and leg drive.',
      instructions: ['Sit with your back and hips flat against the angled pad and place your feet hip-width apart in the centre of the footplate.', 'Release the safety catches, lower the platform until your knees reach roughly 90 degrees without lifting your lower back, then press evenly through your heels.'],
      videoQuery: 'leg press machine exercise technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-cable-triceps-pushdown', name: 'Cable triceps pushdown', bodyPart: 'upper arms', target: 'triceps', equipment: 'cable', secondaryMuscles: ['forearms', 'anterior deltoids'],
      description: 'An isolation cable press for triceps lockout strength and upper-arm definition.',
      instructions: ['Stand facing a high pulley with a rope or straight bar attachment and pin your elbows comfortably beside your ribs.', 'Extend your forearms downwards until your arms are straight, squeeze the triceps briefly, then allow the cable to rise slowly to elbow level.'],
      videoQuery: 'cable triceps pushdown technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-band-face-pull', name: 'Resistance band face pull', bodyPart: 'shoulders', target: 'rear deltoids and upper back', equipment: 'resistance band', secondaryMuscles: ['rotator cuff', 'rhomboids', 'middle trapezius'],
      description: 'A shoulder-health and posture pull targeting the rear deltoids and external rotators.',
      instructions: ['Anchor a resistance band at upper-chest height, hold both ends and step back to create light tension.', 'Pull the band towards your forehead while separating your hands and rotating your thumbs backwards, then return slowly.'],
      videoQuery: 'band face pull exercise technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-forearm-wrist-curl', name: 'Dumbbell wrist curl', bodyPart: 'lower arms', target: 'forearm flexors', equipment: 'dumbbell', secondaryMuscles: ['grip stabilizers'],
      description: 'A targeted forearm and grip-strength movement using light to moderate dumbbells.',
      instructions: ['Rest your forearms along your thighs or a flat bench with your palms facing upwards and wrists just beyond your knees.', 'Lower the dumbbell gently towards your fingers, then curl your wrists upwards with control.'],
      videoQuery: 'dumbbell wrist curl exercise', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
    {
      id: 'starter-plank-core-hold', name: 'Forearm plank core hold', bodyPart: 'waist', target: 'abdominals and core', equipment: 'body weight', secondaryMuscles: ['obliques', 'shoulders', 'glutes'],
      description: 'An isometric gym mat hold building deep trunk stability and spinal endurance.',
      instructions: ['Place your forearms on a mat with elbows directly beneath your shoulders and extend your legs behind you.', 'Brace your abs and glutes to maintain a straight line from head to heels while breathing steadily.'],
      videoQuery: 'forearm plank exercise technique', sourceUrl: 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
    },
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
      id: 'NL8IRKjLPf0', title: 'Upper-body press & chest mechanics', channelTitle: 'NHS',
      exerciseIds: ['starter-wall-press', 'starter-barbell-bench-press', 'starter-cable-triceps-pushdown', 'starter-biceps-curl', 'starter-forearm-wrist-curl'], bodyParts: ['chest', 'upper arms', 'lower arms'],
      sourceUrl: 'https://www.youtube.com/watch?v=NL8IRKjLPf0'
    },
    {
      id: 'oLu9kwDzBdg', title: 'Try a general warm-up', channelTitle: 'NHS',
      embeddable: false, // Owner-disabled external playback observed 24 October 2026; retain provenance only.
      exerciseIds: ['starter-sit-to-stand', 'starter-mini-squat', 'starter-calf-raise', 'starter-wall-press', 'starter-biceps-curl', 'starter-seated-chest-stretch', 'starter-upper-body-twist', 'starter-hip-march', 'starter-ankle-stretch', 'starter-side-bend', 'starter-calf-stretch', 'starter-neck-rotation', 'starter-kettlebell-swing'],
      bodyParts: ['cardio'], sourceUrl: 'https://www.youtube.com/watch?v=oLu9kwDzBdg'
    },
    {
      id: 'GcPujVayIbI', title: 'Upper back, shoulders & posture mechanics', channelTitle: 'Cambridge University Hospitals NHS Foundation Trust',
      exerciseIds: ['starter-seated-chest-stretch', 'starter-upper-body-twist', 'starter-machine-lat-pulldown', 'starter-dumbbell-shoulder-press', 'starter-cable-seated-row', 'starter-band-face-pull'], bodyParts: ['back', 'shoulders', 'chest'],
      sourceUrl: 'https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/'
    },
    {
      id: 'IB-8SWyylME', title: 'Back, core & posterior chain mechanics', channelTitle: 'Cambridge University Hospitals NHS Foundation Trust',
      exerciseIds: ['starter-upper-body-twist', 'starter-side-bend', 'starter-sit-to-stand', 'starter-barbell-deadlift', 'starter-plank-core-hold', 'starter-kettlebell-swing'], bodyParts: ['back', 'upper legs', 'waist', 'cardio'],
      sourceUrl: 'https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/'
    },
    {
      id: 'Kvcc_DhFoeg', title: 'Lower-body squat, leg press & calf mechanics', channelTitle: 'Cambridge University Hospitals NHS Foundation Trust',
      exerciseIds: ['starter-calf-stretch', 'starter-calf-raise', 'starter-mini-squat', 'starter-barbell-back-squat', 'starter-machine-leg-press', 'starter-hip-march', 'starter-ankle-stretch'], bodyParts: ['upper legs', 'lower legs'],
      sourceUrl: 'https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/'
    },
    {
      id: 'Q14tE13GNrs', title: 'Neck & upper-trap mobility', channelTitle: 'Cambridge University Hospitals NHS Foundation Trust',
      exerciseIds: ['starter-neck-rotation'], bodyParts: ['neck'],
      sourceUrl: 'https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/'
    }
  ]
};
