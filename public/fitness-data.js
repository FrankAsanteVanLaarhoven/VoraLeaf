/* VORALEAF × ExerciseDB (RapidAPI) Gym & Strength Catalog.
 * Structured to the official ExerciseDB schema (id, exerciseDbId, name, bodyPart,
 * target, equipment, secondaryMuscles, instructions, motion).
 */
window.VORALEAF_FITNESS = {
  notice: 'Choose gym weights and intensities suitable for your training level. Maintain controlled eccentric and concentric tempo on every repetition.',
  sourceAttribution: 'Exercise schema, muscle targeting and biomechanics powered by ExerciseDB (exercisedb.p.rapidapi.com).',
  categories: ['chest', 'back', 'shoulders', 'upper legs', 'lower legs', 'upper arms', 'lower arms', 'waist', 'cardio', 'neck'],
  exercises: [
    {
      id: 'starter-barbell-bench-press', exerciseDbId: '0025', motion: 'bench-press',
      name: 'Barbell bench press', bodyPart: 'chest', target: 'pectorals', equipment: 'barbell',
      secondaryMuscles: ['anterior deltoids', 'triceps brachii'],
      description: 'ExerciseDB #0025 · Compound horizontal barbell press targeting the sternal and clavicular pectorals.',
      instructions: [
        'Lie flat on the bench with your eyes aligned under the barbell, feet planted firmly on the floor and scapulae retracted.',
        'Unrack the barbell with a pronated grip slightly wider than shoulder width and lower smoothly to the mid-sternum.',
        'Drive the bar upwards along a slight arc back over the shoulders until elbows reach controlled extension.'
      ],
      videoQuery: 'barbell bench press exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-barbell-back-squat', exerciseDbId: '0043', motion: 'squat',
      name: 'Barbell full back squat', bodyPart: 'upper legs', target: 'quadriceps', equipment: 'barbell',
      secondaryMuscles: ['gluteus maximus', 'hamstrings', 'erector spinae', 'core'],
      description: 'ExerciseDB #0043 · Primary lower-body compound squat building quadriceps, glutes and trunk strength.',
      instructions: [
        'Set the barbell across your upper trapezius inside the power rack, unrack and step back into a shoulder-width stance.',
        'Inhale, brace your core 360 degrees and descend by flexing hips and knees simultaneously until thighs pass parallel.',
        'Drive forcefully through the mid-foot while keeping knees tracking over toes to return to standing lockout.'
      ],
      videoQuery: 'barbell back squat exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-barbell-deadlift', exerciseDbId: '0085', motion: 'deadlift',
      name: 'Barbell Romanian deadlift', bodyPart: 'back', target: 'hamstrings and glutes', equipment: 'barbell',
      secondaryMuscles: ['erector spinae', 'latissimus dorsi', 'forearms', 'trapezius'],
      description: 'ExerciseDB #0085 · Hip-hinge barbell pull developing the entire posterior chain, hamstrings and spinal erectors.',
      instructions: [
        'Stand tall holding a loaded barbell at hip level with a shoulder-width overhand grip and a slight knee bend.',
        'Push your hips straight back while keeping your spine neutral and the bar grazing your thighs and shins.',
        'Once you feel a full hamstring stretch below the knee, drive your hips forwards to lock out tall.'
      ],
      videoQuery: 'romanian deadlift barbell technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-machine-lat-pulldown', exerciseDbId: '0197', motion: 'lat-pulldown',
      name: 'Cable wide-grip lat pulldown', bodyPart: 'back', target: 'latissimus dorsi', equipment: 'leverage machine',
      secondaryMuscles: ['biceps brachii', 'rhomboids', 'teres major', 'posterior deltoids'],
      description: 'ExerciseDB #0197 · Vertical overhead gym pull for upper-back width and scapular depression.',
      instructions: [
        'Anchor your thighs securely under the roller pad and grasp the wide angled bar with an overhand grip.',
        'Depress your shoulder blades and pull your elbows down and in towards your ribs until the bar reaches your upper chest.',
        'Pause briefly at peak contraction, then guide the bar smoothly back to full overhead lat stretch.'
      ],
      videoQuery: 'lat pulldown gym exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-dumbbell-shoulder-press', exerciseDbId: '0310', motion: 'shoulder-press',
      name: 'Dumbbell seated overhead press', bodyPart: 'shoulders', target: 'deltoids', equipment: 'dumbbell',
      secondaryMuscles: ['triceps brachii', 'upper trapezius', 'serratus anterior'],
      description: 'ExerciseDB #0310 · Vertical dumbbell press targeting anterior and lateral deltoid heads.',
      instructions: [
        'Sit upright on a 90-degree bench holding a pair of dumbbells at ear level with wrists stacked over elbows.',
        'Press both dumbbells vertically overhead in a controlled arc until arms are extended without clanking the weights.',
        'Lower under a 2-second eccentric tempo back to shoulder height and repeat.'
      ],
      videoQuery: 'dumbbell shoulder press exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-cable-seated-row', exerciseDbId: '0861', motion: 'cable-row',
      name: 'Cable seated low row', bodyPart: 'back', target: 'upper back and lats', equipment: 'cable',
      secondaryMuscles: ['rhomboids', 'middle trapezius', 'biceps brachii', 'rear deltoids'],
      description: 'ExerciseDB #0861 · Horizontal cable row building mid-back density, rhomboids and postural strength.',
      instructions: [
        'Plant your feet on the platform with knees slightly bent and sit tall with a neutral spine holding the V-bar handle.',
        'Drive your elbows straight back past your torso while squeezing your shoulder blades together.',
        'Hold the handle against your midsection for one count before extending your arms forwards under tension.'
      ],
      videoQuery: 'seated cable row exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-kettlebell-swing', exerciseDbId: '0549', motion: 'kettlebell-swing',
      name: 'Kettlebell two-arm swing', bodyPart: 'cardio', target: 'cardiovascular and glutes', equipment: 'kettlebell',
      secondaryMuscles: ['hamstrings', 'erector spinae', 'core', 'deltoids'],
      description: 'ExerciseDB #0549 · Ballistic hip-hinge conditioning exercise for explosive power and metabolic output.',
      instructions: [
        'Stand with feet slightly wider than shoulder width and hike the kettlebell high between your thighs with a flat back.',
        'Snap your hips and glutes into full extension so momentum floats the kettlebell to chest level.',
        'Let the bell descend naturally and hinge only once your forearms reconnect with your upper thighs.'
      ],
      videoQuery: 'kettlebell swing exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-machine-leg-press', exerciseDbId: '0739', motion: 'leg-press',
      name: 'Sled 45-degree leg press', bodyPart: 'upper legs', target: 'quadriceps', equipment: 'leverage machine',
      secondaryMuscles: ['gluteus maximus', 'hamstrings', 'adductors'],
      description: 'ExerciseDB #0739 · Heavy angled sled press isolating the quadriceps and glutes with back support.',
      instructions: [
        'Sit with your lower back and hips pressed firmly into the angled seat and place feet hip-width apart on the sled.',
        'Disengage the safety bars and lower the sled slowly until your knees reach a 90-degree angle.',
        'Press through your heels and mid-foot to extend the legs without locking out the knee joints.'
      ],
      videoQuery: 'leg press machine exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-cable-triceps-pushdown', exerciseDbId: '0201', motion: 'triceps-pushdown',
      name: 'Cable rope triceps pushdown', bodyPart: 'upper arms', target: 'triceps', equipment: 'cable',
      secondaryMuscles: ['anconeus', 'forearm stabilizers'],
      description: 'ExerciseDB #0201 · High-pulley cable extension targeting all three heads of the triceps brachii.',
      instructions: [
        'Attach a rope to a high pulley, hinge slightly forwards from the hips and pin your upper arms to your sides.',
        'Extend your elbows to press the rope downwards, spreading the ends apart at the bottom of the rep.',
        'Squeeze the triceps hard, then control the weight back to a 90-degree elbow angle.'
      ],
      videoQuery: 'cable triceps pushdown technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-band-face-pull', exerciseDbId: '0032', motion: 'face-pull',
      name: 'Band & cable rear-delt face pull', bodyPart: 'shoulders', target: 'posterior deltoids', equipment: 'resistance band',
      secondaryMuscles: ['infraspinatus', 'teres minor', 'rhomboids', 'middle trapezius'],
      description: 'ExerciseDB #0032 · External-rotation upper-back pull for rear deltoids and shoulder joint resilience.',
      instructions: [
        'Anchor the resistance band at eye level, grasp both handles with thumbs pointing backwards and step back.',
        'Pull the centre of the band towards your forehead while flaring elbows high and externally rotating the shoulders.',
        'Pause in the double-biceps rear-delt position, then return smoothly to starting tension.'
      ],
      videoQuery: 'band face pull exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-forearm-wrist-curl', exerciseDbId: '0378', motion: 'wrist-curl',
      name: 'Dumbbell seated palms-up wrist curl', bodyPart: 'lower arms', target: 'forearm flexors', equipment: 'dumbbell',
      secondaryMuscles: ['brachioradialis', 'finger flexors'],
      description: 'ExerciseDB #0378 · Direct forearm flexor curl for grip strength and wrist stability.',
      instructions: [
        'Sit on a flat bench and rest the backs of your forearms along your thighs with wrists extending past your knees.',
        'Allow the dumbbells to roll slightly down towards your fingers under control.',
        'Curl your wrists upwards as high as possible while keeping your forearms flat against your thighs.'
      ],
      videoQuery: 'dumbbell wrist curl exercise',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-plank-core-hold', exerciseDbId: '0464', motion: 'plank',
      name: 'Front forearm plank', bodyPart: 'waist', target: 'abdominals', equipment: 'body weight',
      secondaryMuscles: ['transverse abdominis', 'obliques', 'glutes', 'serratus anterior'],
      description: 'ExerciseDB #0464 · Anti-extension isometric core hold for trunk rigidity and spinal support.',
      instructions: [
        'Set your forearms parallel on the gym mat with elbows stacked directly beneath your shoulders.',
        'Tuck your pelvis slightly, contract your glutes and quadriceps, and maintain a straight line from crown to heels.',
        'Breathe rhythmically behind a braced abdominal wall for the target hold duration.'
      ],
      videoQuery: 'forearm plank exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-biceps-curl', exerciseDbId: '0291', motion: 'biceps-curl',
      name: 'Dumbbell standing alternating biceps curl', bodyPart: 'upper arms', target: 'biceps brachii', equipment: 'dumbbell',
      secondaryMuscles: ['brachialis', 'brachioradialis', 'anterior deltoids'],
      description: 'ExerciseDB #0291 · Supinating dumbbell curl isolating the long and short heads of the biceps.',
      instructions: [
        'Stand tall holding a pair of dumbbells at arm’s length with elbows tucked beside your ribcage.',
        'Curl the weights upwards while supinating your palms so your little fingers turn slightly higher at the top.',
        'Squeeze at peak contraction, then lower under a controlled 2-second eccentric phase.'
      ],
      videoQuery: 'dumbbell biceps curl technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-wall-press', exerciseDbId: '0662', motion: 'push-up',
      name: 'Strict bodyweight push-up', bodyPart: 'chest', target: 'pectorals', equipment: 'body weight',
      secondaryMuscles: ['triceps brachii', 'anterior deltoids', 'core'],
      description: 'ExerciseDB #0662 · Classic horizontal bodyweight press developing chest, triceps and scapular control.',
      instructions: [
        'Set your hands slightly wider than shoulder width in a rigid plank position with glutes and abs braced.',
        'Lower your chest to within an inch of the floor with elbows angled at roughly 45 degrees from your torso.',
        'Press the floor away explosively to full elbow extension while maintaining a straight body line.'
      ],
      videoQuery: 'push up exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-sit-to-stand', exerciseDbId: '0336', motion: 'squat',
      name: 'Dumbbell Bulgarian split squat', bodyPart: 'upper legs', target: 'quadriceps and glutes', equipment: 'dumbbell',
      secondaryMuscles: ['hamstrings', 'adductors', 'calves', 'core'],
      description: 'ExerciseDB #0336 · Rear-foot-elevated unilateral squat for single-leg power, balance and glute hypertrophy.',
      instructions: [
        'Stand two feet in front of a flat bench holding dumbbells at your sides and rest the laces of your rear foot on the pad.',
        'Lower your rear knee towards the floor while keeping your front shin vertical or slightly angled forwards.',
        'Drive through your front heel to return to full single-leg extension.'
      ],
      videoQuery: 'bulgarian split squat dumbbell technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-mini-squat', exerciseDbId: '0285', motion: 'squat',
      name: 'Dumbbell goblet squat', bodyPart: 'upper legs', target: 'quadriceps', equipment: 'dumbbell',
      secondaryMuscles: ['gluteus maximus', 'core', 'upper back'],
      description: 'ExerciseDB #0285 · Front-loaded goblet squat reinforcing upright torso mechanics and deep hip mobility.',
      instructions: [
        'Cup the top bell of a heavy dumbbell or kettlebell tight against your sternum with elbows pointing downwards.',
        'Sit down between your hips while keeping your chest proud and elbows tracking inside your knees.',
        'Press evenly through the floor to stand tall and squeeze the glutes at the top.'
      ],
      videoQuery: 'goblet squat dumbbell technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-calf-raise', exerciseDbId: '0088', motion: 'calf-raise',
      name: 'Barbell standing calf raise', bodyPart: 'lower legs', target: 'calves', equipment: 'barbell',
      secondaryMuscles: ['soleus', 'tibialis posterior'],
      description: 'ExerciseDB #0088 · Loaded ankle plantarflexion targeting the gastrocnemius and soleus complex.',
      instructions: [
        'Position the barbell across your upper back with the balls of your feet elevated on a calf block.',
        'Lower your heels below the platform level to achieve a deep gastrocnemius stretch.',
        'Drive up onto the balls of your feet as high as possible and hold the peak contraction for one second.'
      ],
      videoQuery: 'standing barbell calf raise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-seated-chest-stretch', exerciseDbId: '0308', motion: 'bench-press',
      name: 'Dumbbell incline chest fly', bodyPart: 'chest', target: 'upper pectorals', equipment: 'dumbbell',
      secondaryMuscles: ['anterior deltoids', 'biceps brachii (stabilizer)'],
      description: 'ExerciseDB #0308 · Incline arc adduction isolating the clavicular pectoral fibres under a deep stretch.',
      instructions: [
        'Lie on a 30-degree incline bench holding dumbbells above your upper chest with a slight bend in your elbows.',
        'Open your arms wide in a smooth arc until you feel a controlled stretch across the chest.',
        'Bring the dumbbells back together over your sternum as if hugging a barrel.'
      ],
      videoQuery: 'incline dumbbell chest fly technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-upper-body-twist', exerciseDbId: '0651', motion: 'lat-pulldown',
      name: 'Wide-grip pull-up', bodyPart: 'back', target: 'latissimus dorsi', equipment: 'body weight',
      secondaryMuscles: ['biceps brachii', 'teres major', 'rhomboids', 'core'],
      description: 'ExerciseDB #0651 · Overhead bodyweight vertical pull for upper-body relative strength and V-taper lats.',
      instructions: [
        'Hang from a pull-up bar with a pronated grip wider than shoulder width and engage your scapulae.',
        'Pull your sternum towards the bar by driving your elbows down towards your hips.',
        'Lower with full control back to a dead hang before initiating the next repetition.'
      ],
      videoQuery: 'wide grip pull up technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-hip-march', exerciseDbId: '1409', motion: 'deadlift',
      name: 'Barbell hip thrust', bodyPart: 'upper legs', target: 'glutes', equipment: 'barbell',
      secondaryMuscles: ['hamstrings', 'quadriceps', 'core'],
      description: 'ExerciseDB #1409 · Horizontal loaded hip extension maximizing peak gluteus maximus activation.',
      instructions: [
        'Sit on the floor with your upper back against a bench and roll a padded barbell over your hip crease.',
        'Plant your feet so your shins are vertical at the top of the movement and drive your hips upwards.',
        'Lock out with a level pelvis and hard glute squeeze, then lower hips under control.'
      ],
      videoQuery: 'barbell hip thrust technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-ankle-stretch', exerciseDbId: '1374', motion: 'calf-raise',
      name: 'Seated machine calf raise', bodyPart: 'lower legs', target: 'soleus and calves', equipment: 'leverage machine',
      secondaryMuscles: ['gastrocnemius', 'achilles complex'],
      description: 'ExerciseDB #1374 · Bent-knee calf press isolating the deep soleus muscle of the lower leg.',
      instructions: [
        'Sit at the seated calf raise machine with the balls of your feet on the platform and knees under the pad.',
        'Release the safety lever, lower your heels into a full dorsiflexion stretch, then press up to full extension.'
      ],
      videoQuery: 'seated calf raise machine technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-side-bend', exerciseDbId: '0687', motion: 'plank',
      name: 'Weighted Russian core twist', bodyPart: 'waist', target: 'obliques and abs', equipment: 'dumbbell',
      secondaryMuscles: ['rectus abdominis', 'hip flexors', 'transverse abdominis'],
      description: 'ExerciseDB #0687 · Rotational trunk conditioning targeting the internal and external obliques.',
      instructions: [
        'Sit on a mat with knees bent, torso reclined to 45 degrees and hold a dumbbell or weight plate at chest level.',
        'Rotate your ribcage and shoulders from side to side under control while keeping your spine long.'
      ],
      videoQuery: 'russian twist exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-calf-stretch', exerciseDbId: '1372', motion: 'leg-press',
      name: 'Sled calf press on leg press', bodyPart: 'lower legs', target: 'gastrocnemius', equipment: 'leverage machine',
      secondaryMuscles: ['soleus'],
      description: 'ExerciseDB #1372 · Straight-leg sled toe press for heavy gastrocnemius loading.',
      instructions: [
        'Position the balls of your feet along the bottom edge of the leg press sled with legs extended and knees soft.',
        'Allow the sled to flex your ankles into a controlled stretch, then press forcefully through the balls of your feet.'
      ],
      videoQuery: 'calf press on leg press machine',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    },
    {
      id: 'starter-neck-rotation', exerciseDbId: '0406', motion: 'shoulder-press',
      name: 'Dumbbell standing upper-trap shrug', bodyPart: 'neck', target: 'upper trapezius and neck', equipment: 'dumbbell',
      secondaryMuscles: ['levator scapulae', 'rhomboids', 'forearms'],
      description: 'ExerciseDB #0406 · Vertical scapular elevation strengthening the upper trapezius and cervical support.',
      instructions: [
        'Stand tall holding heavy dumbbells at your sides with a neutral head position.',
        'Elevate your shoulders straight up towards your ears without rolling the joints, pause for one second, then lower slowly.'
      ],
      videoQuery: 'dumbbell shrug exercise technique',
      sourceUrl: 'https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb'
    }
  ],
  videos: []
};
