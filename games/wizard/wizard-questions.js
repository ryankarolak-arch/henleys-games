(function () {
  // ===================================================================
  // Wizard question banks for Reading, Art, Science and History.
  // Each item: [question, correctAnswer, wrong1, wrong2, (wrong3)].
  // Choice order is shuffled at play time. Math is generated in wizard.js.
  // Keep facts simple, well-established, and age-appropriate.
  // ===================================================================

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // ---------- Generated: missing letters (Reading) ----------
  const CVC = [
    ['CAT', '🐱'], ['DOG', '🐶'], ['PIG', '🐷'], ['SUN', '☀️'], ['BUS', '🚌'], ['BED', '🛏️'], ['HAT', '🎩'],
    ['CUP', '🥤'], ['FOX', '🦊'], ['HEN', '🐔'], ['BAT', '🦇'], ['WEB', '🕸️'], ['MAP', '🗺️'], ['BOX', '📦'],
    ['BUG', '🐛'], ['VAN', '🚐'], ['NET', '🥅'], ['PEN', '🖊️'], ['LOG', '🪵'], ['NUT', '🥜'],
  ];
  const VOWELS = ['A', 'E', 'I', 'O', 'U'];
  function missingVowel(seen) {
    const pool = CVC.filter(w => !seen.has('mv:' + w[0]));
    const [word, emoji] = pick(pool.length ? pool : CVC);
    seen.add('mv:' + word);
    const v = word[1];
    const wrongs = shuffle(VOWELS.filter(x => x !== v)).slice(0, 3);
    return {
      key: 'mv:' + word, prompt: '🔤 Missing letter', visual: emoji,
      text: 'Which letter is missing?  ' + word[0] + ' _ ' + word[2],
      say: 'Which letter is missing in the word ' + word.toLowerCase() + '?',
      answer: v, wrongs,
    };
  }
  const DIGRAPH = ['SH', 'CH', 'TH', 'WH'];
  const BLEND = ['FR', 'TR', 'DR', 'ST', 'SN', 'CL', 'FL', 'CR', 'GR', 'PL', 'BR', 'SK', 'SL'];
  const BLEND_WORDS = [
    // [start letters, rest, emoji, group]
    ['SH', 'IP', '🚢', DIGRAPH], ['SH', 'EEP', '🐑', DIGRAPH], ['SH', 'OE', '👟', DIGRAPH], ['SH', 'ELL', '🐚', DIGRAPH],
    ['CH', 'ICK', '🐤', DIGRAPH], ['CH', 'EESE', '🧀', DIGRAPH], ['CH', 'AIR', '🪑', DIGRAPH], ['CH', 'ERRY', '🍒', DIGRAPH],
    ['TH', 'UMB', '👍', DIGRAPH], ['WH', 'ALE', '🐳', DIGRAPH],
    ['FR', 'OG', '🐸', BLEND], ['TR', 'EE', '🌳', BLEND], ['DR', 'UM', '🥁', BLEND], ['ST', 'AR', '⭐', BLEND],
    ['SN', 'AKE', '🐍', BLEND], ['CL', 'OCK', '⏰', BLEND], ['FL', 'AG', '🚩', BLEND], ['CR', 'AB', '🦀', BLEND],
    ['GR', 'APES', '🍇', BLEND], ['TR', 'UCK', '🚚', BLEND], ['PL', 'ANE', '✈️', BLEND], ['SN', 'AIL', '🐌', BLEND],
    ['SK', 'UNK', '🦨', BLEND], ['SL', 'ED', '🛷', BLEND],
  ];
  function missingBlend(seen) {
    const pool = BLEND_WORDS.filter(w => !seen.has('mb:' + w[0] + w[1]));
    const [start, rest, emoji, group] = pick(pool.length ? pool : BLEND_WORDS);
    seen.add('mb:' + start + rest);
    const wrongs = shuffle(group.filter(x => x !== start)).slice(0, 3);
    return {
      key: 'mb:' + start + rest, prompt: '🔤 Missing letters', visual: emoji,
      text: 'Which letters start the word?  _ _ ' + rest,
      say: 'Which two letters start the word ' + (start + rest).toLowerCase() + '?',
      answer: start, wrongs,
    };
  }

  // ---------- Generated: patterns (Art, 1st grade) ----------
  const PATTERN_SETS = [['🔴', '🔵', '🟡'], ['⭐', '🌙', '☀️'], ['🍎', '🍌', '🍇'], ['🟥', '🟩', '🟦'],
    ['🐶', '🐱', '🐰'], ['❤️', '💛', '💜'], ['🌸', '🍀', '🌻'], ['🔺', '⚪', '🟦']];
  const PATTERN_KINDS = [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2], [0, 0, 1, 1]];
  function pattern(seen) {
    for (let tries = 0; tries < 30; tries++) {
      const set = shuffle(pick(PATTERN_SETS));
      const kind = pick(PATTERN_KINDS);
      const len = kind.length * 2 + ri(0, kind.length - 1);
      const seq = [];
      for (let i = 0; i <= len; i++) seq.push(set[kind[i % kind.length]]);
      const answer = seq.pop();
      const key = 'pat:' + seq.join('') + answer;
      if (seen.has(key)) continue;
      seen.add(key);
      const used = Array.from(new Set(kind.map(k => set[k])));
      const extra = set.filter(x => used.indexOf(x) === -1);
      const wrongs = used.filter(x => x !== answer).concat(extra).slice(0, 2);
      return { key, prompt: '🎨 Pattern', visual: seq.join(' ') + ' ❓', text: 'What comes next in the pattern?', say: 'What comes next in the pattern?', answer, wrongs };
    }
    return null;
  }

  // ===================================================================
  // Static banks. Categories are mixed so a trip never repeats one twice in a row.
  // ===================================================================
  const BANKS = {
    reading: {
      g1: {
        'Missing letter': missingVowel,
        'Rhyme time': [
          ['Which word rhymes with CAT? 🐱', 'hat', 'dog', 'sun', 'cup'],
          ['Which word rhymes with BUG? 🐛', 'rug', 'bed', 'pig', 'top'],
          ['Which word rhymes with SUN? ☀️', 'run', 'sit', 'map', 'fox'],
          ['Which word rhymes with PIG? 🐷', 'wig', 'pan', 'cub', 'net'],
          ['Which word rhymes with HOP?', 'mop', 'hip', 'bed', 'sad'],
          ['Which word rhymes with BED? 🛏️', 'red', 'bag', 'sit', 'pot'],
          ['Which word rhymes with CAKE? 🎂', 'lake', 'cook', 'kite', 'cup'],
          ['Which word rhymes with FOX? 🦊', 'box', 'fan', 'fig', 'bus'],
          ['Which word rhymes with STAR? ⭐', 'car', 'sun', 'sit', 'stop'],
          ['Which word rhymes with BEE? 🐝', 'tree', 'bed', 'bus', 'bat'],
          ['Which word rhymes with KING? 👑', 'ring', 'kite', 'cap', 'kid'],
          ['Which word rhymes with BOAT? ⛵', 'goat', 'bat', 'bike', 'bun'],
          ['Which word rhymes with MAN?', 'can', 'map', 'mud', 'sit'],
          ['Which word rhymes with HEN? 🐔', 'ten', 'ham', 'hot', 'him'],
        ],
        'Fill the blank': [
          ['I ___ a big dog. 🐶', 'see', 'of', 'and', 'the'],
          ['The cat ___ on the mat. 🐱', 'sat', 'sun', 'red', 'big'],
          ['We ___ to the park.', 'go', 'is', 'the', 'red'],
          ['Look ___ me!', 'at', 'dog', 'is', 'run'],
          ['She has ___ red hat.', 'a', 'is', 'go', 'up'],
          ['Can you ___ me?', 'help', 'hat', 'red', 'the'],
          ['The sun is ___. ☀️', 'hot', 'ran', 'of', 'and'],
          ['I like ___ play.', 'to', 'is', 'at', 'he'],
          ['My dog ___ fast. 🐕', 'runs', 'red', 'the', 'at'],
          ['Come ___ with me!', 'play', 'the', 'of', 'is'],
        ],
        'Story time': [
          ['Sam has a red ball. He kicks it far. What color is the ball?', 'Red 🔴', 'Blue 🔵', 'Green 🟢'],
          ['Mia sees a frog. The frog jumps into the pond. What jumps into the pond?', 'The frog 🐸', 'Mia', 'A fish 🐟'],
          ['The dog is wet. It ran in the rain. Why is the dog wet?', 'It ran in the rain 🌧️', 'It ate food', 'It took a nap'],
          ['Ben has two cats. One is black. One is white. How many cats does Ben have?', '2', '1', '3'],
          ['Lily puts on her coat and hat. It is cold outside. What is the weather like?', 'Cold 🥶', 'Hot 🥵', 'Very warm'],
          ['The bird sat in its nest. It had three eggs. Where did the bird sit?', 'In its nest 🪺', 'In a car', 'On a bed'],
          ['Max ate a big red apple for a snack. What did Max eat?', 'An apple 🍎', 'A banana 🍌', 'A cookie 🍪'],
          ['The bus is yellow. It takes kids to school. Where does the bus take kids?', 'To school 🏫', 'To the zoo', 'To the moon'],
        ],
        'Opposites': [
          ['What is the opposite of HOT?', 'cold', 'wet', 'big'],
          ['What is the opposite of BIG?', 'little', 'red', 'fast'],
          ['What is the opposite of UP?', 'down', 'in', 'on'],
          ['What is the opposite of DAY?', 'night', 'sun', 'play'],
          ['What is the opposite of HAPPY? 😀', 'sad', 'glad', 'funny'],
          ['What is the opposite of FAST?', 'slow', 'quick', 'run'],
          ['What is the opposite of OPEN?', 'closed', 'door', 'big'],
          ['What is the opposite of WET?', 'dry', 'rain', 'cold'],
          ['What is the opposite of ON?', 'off', 'top', 'yes'],
          ['What is the opposite of FULL?', 'empty', 'big', 'more'],
        ],
      },
      g2: {
        'Missing letters': missingBlend,
        'Same meaning': [
          ['Which word means the same as BIG?', 'large', 'tiny', 'quick', 'soft'],
          ['Which word means the same as HAPPY?', 'glad', 'sad', 'angry', 'sleepy'],
          ['Which word means the same as FAST?', 'quick', 'slow', 'loud', 'soft'],
          ['Which word means the same as SMALL?', 'little', 'huge', 'tall', 'heavy'],
          ['Which word means the same as BEGIN?', 'start', 'end', 'sleep', 'lose'],
          ['Which word means the same as SHUT?', 'close', 'open', 'push', 'jump'],
          ['Which word means the same as YELL?', 'shout', 'whisper', 'sit', 'listen'],
          ['Which word means the same as SCARED?', 'afraid', 'brave', 'happy', 'calm'],
          ['Which word means the same as PRETTY?', 'beautiful', 'ugly', 'loud', 'wet'],
          ['Which word means the same as JUMP?', 'leap', 'sit', 'sleep', 'crawl'],
        ],
        'Opposites': [
          ['Which word is the opposite of LOUD?', 'quiet', 'noisy', 'big', 'happy'],
          ['Which word is the opposite of HEAVY?', 'light', 'big', 'hard', 'strong'],
          ['Which word is the opposite of SMOOTH?', 'rough', 'soft', 'flat', 'shiny'],
          ['Which word is the opposite of ABOVE?', 'below', 'over', 'up', 'high'],
          ['Which word is the opposite of QUESTION?', 'answer', 'ask', 'word', 'think'],
          ['Which word is the opposite of REMEMBER?', 'forget', 'recall', 'think', 'know'],
          ['Which word is the opposite of STRONG?', 'weak', 'tough', 'big', 'brave'],
          ['Which word is the opposite of ASLEEP?', 'awake', 'tired', 'dreaming', 'quiet'],
          ['Which word is the opposite of PUSH?', 'pull', 'shove', 'press', 'kick'],
          ['Which word is the opposite of ARRIVE?', 'leave', 'come', 'reach', 'land'],
        ],
        'Compound words': [
          ['rain + bow = ? 🌈', 'rainbow', 'raincoat', 'elbow', 'rainy'],
          ['foot + ball = ? 🏈', 'football', 'footprint', 'baseball', 'ballet'],
          ['cup + cake = ? 🧁', 'cupcake', 'pancake', 'cupboard', 'cakes'],
          ['star + fish = ?', 'starfish', 'starlight', 'catfish', 'stars'],
          ['tooth + brush = ? 🪥', 'toothbrush', 'hairbrush', 'toothpaste', 'brushing'],
          ['snow + man = ? ⛄', 'snowman', 'snowball', 'mailman', 'snowy'],
          ['bed + room = ? 🛏️', 'bedroom', 'bathroom', 'bedtime', 'roomy'],
          ['pop + corn = ? 🍿', 'popcorn', 'popsicle', 'cornfield', 'acorn'],
          ['butter + fly = ? 🦋', 'butterfly', 'dragonfly', 'buttercup', 'flying'],
        ],
        'Story time': [
          ['Tom planted a seed in a pot. He gave it water every day. Soon a sprout came up. What did Tom do every day?', 'He watered the seed 💧', 'He ate the seed', 'He painted the pot'],
          ['Ana packed a towel, a shovel, and a bucket. She can\'t wait to build a sandcastle! Where is Ana going?', 'To the beach 🏖️', 'To school', 'To the library'],
          ['The puppy chewed Dad\'s slipper. Dad frowned and put the slipper up high. How did Dad feel?', 'Upset 😠', 'Excited', 'Sleepy'],
          ['First, Kim got a bowl. Next, she poured cereal. Last, she added milk. What did Kim do first?', 'Got a bowl 🥣', 'Added milk', 'Poured cereal'],
          ['Owls sleep during the day. At night they wake up and hunt for food. When do owls hunt?', 'At night 🌙', 'In the morning', 'At lunch time'],
          ['Jake\'s kite went up, up, up. Then the wind stopped, and the kite fell down. Why did the kite fall?', 'The wind stopped', 'Jake let go', 'It started to rain'],
          ['Rosa read a book about sharks. She learned sharks have many rows of teeth. What was the book about?', 'Sharks 🦈', 'Dogs', 'Trains'],
          ['The leaves turned red and orange. They fell from the trees and crunched under our feet. What season is it?', 'Fall 🍂', 'Summer', 'Spring'],
        ],
        'Word power': [
          ['Which word is an action word (a verb)?', 'jump', 'table', 'blue', 'happy'],
          ['Which word is an action word (a verb)?', 'swim', 'fish', 'green', 'soft'],
          ['Which word is a noun (a person, place, or thing)?', 'school', 'run', 'pretty', 'quickly'],
          ['Which word is a noun (a person, place, or thing)?', 'teacher', 'sing', 'tall', 'slowly'],
          ['What is the short way to write DO NOT?', 'don\'t', 'didn\'t', 'doesn\'t', 'won\'t'],
          ['What is the short way to write I AM?', 'I\'m', 'I\'ll', 'I\'ve', 'I\'d'],
          ['What is the short way to write CAN NOT?', 'can\'t', 'don\'t', 'won\'t', 'couldn\'t'],
          ['One mouse, two ___ 🐭', 'mice', 'mouses', 'mousies', 'mices'],
          ['One foot, two ___ 🦶', 'feet', 'foots', 'feets', 'footses'],
          ['One child, many ___', 'children', 'childs', 'childrens', 'childes'],
        ],
      },
      g3: {
        'Prefixes & suffixes': [
          ['What does UNHAPPY mean?', 'not happy', 'very happy', 'happy again', 'happy before'],
          ['What does REDO mean?', 'do again', 'not do', 'do before', 'do badly'],
          ['In the word PREHEAT, what does PRE- mean?', 'before', 'again', 'not', 'after'],
          ['What does CAREFUL mean?', 'full of care', 'without care', 'care again', 'not caring'],
          ['What does FEARLESS mean?', 'without fear', 'full of fear', 'fear again', 'more fear'],
          ['A TEACHER is a person who ___', 'teaches', 'is taught', 'teaches again', 'never teaches'],
          ['What does DISAGREE mean?', 'not agree', 'agree again', 'agree before', 'agree a lot'],
          ['What does REREAD mean?', 'read again', 'not read', 'read badly', 'read slowly'],
          ['Which word means "able to be washed"?', 'washable', 'washer', 'unwashed', 'washing'],
        ],
        'Sound-alike words': [
          ['Pick the right word: I can ___ the ocean.', 'see', 'sea'],
          ['Pick the right word: The ___ is full of fish.', 'sea', 'see'],
          ['Pick the right word: I have ___ dogs.', 'two', 'to', 'too'],
          ['Pick the right word: We went ___ the store.', 'to', 'two', 'too'],
          ['Pick the right word: Can I come ___?', 'too', 'two', 'to'],
          ['Pick the right word: The wind ___ hard.', 'blew', 'blue'],
          ['Pick the right word: The kids got ___ coats.', 'their', 'there', 'they\'re'],
          ['Pick the right word: Put the box over ___.', 'there', 'their', 'they\'re'],
          ['Pick the right word: I ___ the answer!', 'know', 'no'],
          ['Pick the right word: Please ___ your name.', 'write', 'right'],
          ['Pick the right word: Turn ___ at the corner.', 'right', 'write'],
        ],
        'Grammar': [
          ['Which word is an adjective (it describes a noun)?', 'fluffy', 'jump', 'kitten', 'slowly'],
          ['Which word is an adjective (it describes a noun)?', 'shiny', 'polish', 'coin', 'quickly'],
          ['Which word is an adverb (it tells how)?', 'quickly', 'quick', 'runner', 'race'],
          ['Which word is an adverb (it tells how)?', 'quietly', 'quiet', 'library', 'whisper'],
          ['Yesterday I ___ an apple.', 'ate', 'eated', 'eats', 'eating'],
          ['Last week we ___ to the zoo.', 'went', 'goed', 'go', 'going'],
          ['Last night she ___ a song.', 'sang', 'singed', 'sing', 'sings'],
          ['He ___ to school every day.', 'walks', 'walk', 'walking'],
          ['Which word is a proper noun?', 'Texas', 'state', 'river', 'city'],
          ['Which word is a pronoun?', 'she', 'girl', 'happy', 'run'],
          ['Which one is a complete sentence?', 'The dog barked.', 'The big dog.', 'Barked loudly.', 'In the yard.'],
        ],
        'Word meaning': [
          ['The giant whale was ENORMOUS. What does ENORMOUS mean?', 'very big', 'very small', 'very loud', 'very fast'],
          ['After the long hike, Leo was EXHAUSTED and fell asleep. What does EXHAUSTED mean?', 'very tired', 'very hungry', 'very happy', 'very angry'],
          ['The soup was SCALDING, so we waited before eating it. What does SCALDING mean?', 'very hot', 'very cold', 'very salty', 'very sweet'],
          ['Maya was FURIOUS when her block tower was knocked down. What does FURIOUS mean?', 'very angry', 'very glad', 'very sleepy', 'very calm'],
          ['The room was so CLUTTERED we couldn\'t see the floor. What does CLUTTERED mean?', 'messy and full', 'clean and empty', 'dark', 'quiet'],
          ['The TIMID mouse hid whenever anyone came near. What does TIMID mean?', 'shy and scared', 'bold', 'loud', 'sleepy'],
          ['The RAPID river rushed past the rocks. What does RAPID mean?', 'fast', 'slow', 'still', 'tiny'],
          ['The desert is ARID; it hardly ever rains there. What does ARID mean?', 'very dry', 'very wet', 'very windy', 'very green'],
        ],
        'Story time': [
          ['Bees fly from flower to flower. They carry pollen, which helps new plants grow. What is the main idea?', 'Bees help plants grow 🐝', 'Bees are yellow', 'Flowers smell nice'],
          ['Carlos grabbed his umbrella and rain boots. The sky was dark gray. What is the weather probably like?', 'Rainy 🌧️', 'Hot and sunny', 'Clear and dry'],
          ['Nora practiced piano every day for a month. At her recital, she played without a mistake. What is the lesson?', 'Practice helps you improve', 'Pianos are loud', 'Recitals are long'],
          ['The fox could not reach the grapes. "They are probably sour anyway," he said, and walked away. How does the fox feel?', 'Disappointed', 'Thrilled', 'Proud', 'Full'],
          ['Penguins cannot fly, but they are great swimmers. They use their wings like flippers. Which is true?', 'Penguins use their wings to swim 🐧', 'Penguins fly south', 'Penguins cannot swim'],
          ['Grandpa grew tomatoes, beans, and squash. Every summer he shared them with his neighbors. What is Grandpa like?', 'Kind and sharing', 'Selfish', 'Lazy', 'Scared'],
          ['First the caterpillar ate leaves. Then it made a chrysalis. Finally, it came out as a butterfly. What happened right after it ate leaves?', 'It made a chrysalis', 'It flew away', 'It laid eggs'],
          ['Everyone was reading quietly. Rows of books lined the shelves. Where does this story take place?', 'A library 📚', 'A playground', 'A zoo'],
        ],
        'Synonyms & antonyms': [
          ['Which word is the OPPOSITE of GENEROUS?', 'selfish', 'kind', 'giving', 'friendly'],
          ['Which word means the SAME as DIFFICULT?', 'hard', 'easy', 'simple', 'quick'],
          ['Which word means the SAME as GIGANTIC?', 'huge', 'tiny', 'short', 'thin'],
          ['Which word is the OPPOSITE of ANCIENT?', 'modern', 'old', 'broken', 'dusty'],
          ['Which word means the SAME as GIGGLE?', 'laugh', 'cry', 'frown', 'yawn'],
          ['Which word is the OPPOSITE of BRAVE?', 'fearful', 'bold', 'strong', 'heroic'],
          ['Which word means the SAME as TIDY?', 'neat', 'messy', 'dirty', 'loud'],
          ['Which word is the OPPOSITE of ENTRANCE?', 'exit', 'door', 'gate', 'hallway'],
        ],
      },
    },

    art: {
      g1: {
        'Pattern': pattern,
        'Mixing colors': [
          ['Red + Yellow makes ___', 'Orange 🟠', 'Green 🟢', 'Purple 🟣'],
          ['Blue + Yellow makes ___', 'Green 🟢', 'Orange 🟠', 'Purple 🟣'],
          ['Red + Blue makes ___', 'Purple 🟣', 'Green 🟢', 'Orange 🟠'],
          ['Red + White makes ___', 'Pink', 'Brown', 'Green'],
          ['Black + White makes ___', 'Gray', 'Pink', 'Yellow'],
          ['Blue + White makes ___', 'Light blue', 'Dark red', 'Orange'],
          ['Which one is a primary color?', 'Red 🔴', 'Green 🟢', 'Purple 🟣', 'Orange 🟠'],
          ['Which one is a primary color?', 'Blue 🔵', 'Green 🟢', 'Purple 🟣', 'Orange 🟠'],
          ['Which one is a primary color?', 'Yellow 🟡', 'Green 🟢', 'Purple 🟣', 'Orange 🟠'],
          ['How many primary colors are there?', '3', '2', '5', '7'],
          ['Which color is in a rainbow? 🌈', 'Green', 'Black', 'Brown', 'Gray'],
        ],
        'Colors': [
          ['Which crayon would you use to color a pumpkin? 🎃', 'Orange', 'Blue', 'Purple', 'Gray'],
          ['Which crayon would you use to color grass? 🌱', 'Green', 'Red', 'Orange', 'Pink'],
          ['Which crayon would you use to color a ripe banana? 🍌', 'Yellow', 'Blue', 'Purple', 'Black'],
          ['Which crayon would you use to color a fire truck? 🚒', 'Red', 'Green', 'Blue', 'Brown'],
          ['Which crayon would you use to color the sky on a sunny day?', 'Blue', 'Green', 'Brown', 'Orange'],
          ['Which crayon would you use to color a snowman? ⛄', 'White', 'Green', 'Orange', 'Purple'],
          ['Which crayon would you use to color a frog? 🐸', 'Green', 'Pink', 'Orange', 'White'],
          ['Which crayon would you use to color a lemon? 🍋', 'Yellow', 'Blue', 'Purple', 'Black'],
          ['Which crayon would you use to color a chocolate cookie? 🍪', 'Brown', 'Blue', 'Green', 'Pink'],
        ],
        'Shapes': [
          ['How many sides does a triangle have? 🔺', '3', '4', '5', '2'],
          ['How many sides does a square have? 🟥', '4', '3', '5', '6'],
          ['Which shape is round like a ball? ⚽', 'Circle', 'Square', 'Triangle', 'Rectangle'],
          ['A slice of pizza 🍕 looks most like which shape?', 'Triangle', 'Circle', 'Square'],
          ['Which shape has no corners?', 'Circle', 'Square', 'Triangle', 'Rectangle'],
          ['A door 🚪 is shaped like a ___', 'Rectangle', 'Circle', 'Triangle'],
          ['What shape is this? ⭐', 'Star', 'Heart', 'Moon'],
          ['What shape is this? ❤️', 'Heart', 'Star', 'Circle'],
          ['Which shape has 3 corners?', 'Triangle', 'Square', 'Circle', 'Rectangle'],
          ['How many sides does a rectangle have?', '4', '3', '5', '6'],
          ['An egg 🥚 is shaped like an ___', 'oval', 'square', 'triangle', 'star'],
        ],
        'Art tools': [
          ['What do you use to cut paper? ✂️', 'Scissors', 'Glue', 'Crayon', 'Eraser'],
          ['What do you use to stick paper together?', 'Glue', 'Scissors', 'Ruler', 'Paintbrush'],
          ['What do you dip in paint to make brush strokes? 🖌️', 'Paintbrush', 'Ruler', 'Scissors', 'Tape'],
          ['What do you use to erase pencil marks?', 'Eraser', 'Marker', 'Glue', 'Paint'],
          ['Which tool helps you draw a straight line? 📏', 'Ruler', 'Scissors', 'Glue', 'Sponge'],
          ['What can you squish and shape with your hands?', 'Clay', 'Pencil', 'Ruler', 'Scissors'],
          ['An artist who paints pictures is called a ___', 'Painter', 'Baker', 'Farmer', 'Pilot'],
          ['Where can you go to see lots of famous art? 🖼️', 'A museum', 'A gas station', 'A car wash', 'A bank'],
          ['A picture you make with a pencil is called a ___ ✏️', 'drawing', 'song', 'dance', 'recipe'],
        ],
      },
      g2: {
        'Color wheel': [
          ['Which is a secondary color (made by mixing two primary colors)?', 'Green', 'Red', 'Blue', 'Yellow'],
          ['Which is a secondary color (made by mixing two primary colors)?', 'Orange', 'Red', 'Blue', 'Yellow'],
          ['Which is a secondary color (made by mixing two primary colors)?', 'Purple', 'Red', 'Blue', 'Yellow'],
          ['Which is a warm color, like fire? 🔥', 'Orange', 'Blue', 'Green', 'Purple'],
          ['Which is a cool color, like water? 💧', 'Blue', 'Red', 'Orange', 'Yellow'],
          ['Red, orange, and yellow are called ___ colors.', 'warm', 'cool', 'dark', 'quiet'],
          ['Blue, green, and purple are called ___ colors.', 'cool', 'warm', 'hot', 'loud'],
          ['Adding white to a color makes it ___', 'lighter', 'darker', 'disappear', 'shiny'],
          ['Adding black to a color makes it ___', 'darker', 'lighter', 'brighter', 'see-through'],
          ['Which two colors mix to make green?', 'Blue + Yellow', 'Red + Yellow', 'Red + Blue', 'Black + White'],
          ['Which two colors mix to make orange?', 'Red + Yellow', 'Blue + Yellow', 'Red + Blue', 'Blue + White'],
        ],
        'Shapes & lines': [
          ['How many sides does a pentagon have?', '5', '4', '6', '8'],
          ['How many sides does a hexagon have? (like a honeycomb cell)', '6', '5', '8', '4'],
          ['A stop sign 🛑 is shaped like an ___', 'octagon', 'oval', 'oblong', 'arrow'],
          ['Which 3D shape is like a ball? ⚽', 'Sphere', 'Cube', 'Cone', 'Cylinder'],
          ['An ice cream cone 🍦 is shaped like a ___', 'Cone', 'Cube', 'Sphere', 'Pyramid'],
          ['A die 🎲 is shaped like a ___', 'Cube', 'Cone', 'Sphere', 'Cylinder'],
          ['A soup can 🥫 is shaped like a ___', 'Cylinder', 'Cube', 'Cone', 'Pyramid'],
          ['A line that goes up and down like pointy mountains is a ___ line.', 'zigzag', 'wavy', 'straight', 'dotted'],
          ['A line that curves gently like ocean waves is a ___ line.', 'wavy', 'zigzag', 'straight', 'dotted'],
        ],
        'Kinds of art': [
          ['A picture of a person is called a ___', 'portrait', 'landscape', 'map', 'sculpture'],
          ['A picture of mountains, trees, and sky is called a ___', 'landscape', 'portrait', 'sculpture', 'pattern'],
          ['Art you can walk around, like a statue, is called a ___', 'sculpture', 'drawing', 'painting', 'photo'],
          ['A picture an artist makes of themself is a ___', 'self-portrait', 'landscape', 'still life', 'map'],
          ['A very big painting on a wall is called a ___', 'mural', 'stamp', 'sticker', 'bookmark'],
          ['Pottery is usually made from ___', 'clay', 'paper', 'glass beads', 'yarn'],
        ],
        'Famous artists': [
          ['Who painted "The Starry Night"? 🌌', 'Vincent van Gogh', 'Leonardo da Vinci', 'Frida Kahlo', 'Claude Monet'],
          ['Who painted the "Mona Lisa"?', 'Leonardo da Vinci', 'Vincent van Gogh', 'Pablo Picasso', 'Georgia O\'Keeffe'],
          ['Claude Monet painted many pictures of ___ in his garden pond.', 'water lilies', 'race cars', 'robots', 'skyscrapers'],
          ['Frida Kahlo was an artist from ___', 'Mexico', 'Japan', 'Canada', 'Egypt'],
          ['Frida Kahlo is famous for painting many ___', 'self-portraits', 'maps', 'cartoons', 'race cars'],
          ['Pablo Picasso was an artist from ___', 'Spain', 'Japan', 'Brazil', 'Canada'],
          ['Vincent van Gogh painted a famous picture of ___ in a vase. 🌻', 'sunflowers', 'robots', 'airplanes', 'pizza'],
        ],
        'Art tools': [
          ['A ___ is a board an artist holds to mix paint on. 🎨', 'palette', 'ruler', 'stapler', 'pillow'],
          ['A stand that holds a painting while the artist works is an ___', 'easel', 'eraser', 'envelope', 'oven'],
          ['A special oven for baking clay pottery is a ___', 'kiln', 'toaster', 'freezer', 'sink'],
          ['Painters often paint on cloth stretched on a frame, called a ___', 'canvas', 'pillow', 'blanket', 'towel'],
          ['What do you wear to keep paint off your clothes?', 'A smock or apron', 'Sunglasses', 'A helmet', 'Mittens'],
          ['Which art supply is a stick of colored wax?', 'Crayon', 'Glue', 'Chalkboard', 'Sponge'],
          ['Which tool makes thin lines and can be sharpened?', 'Colored pencil', 'Paint roller', 'Sponge', 'Glue stick'],
        ],
      },
      g3: {
        'Color theory': [
          ['Which color is opposite RED on the color wheel?', 'Green', 'Orange', 'Purple', 'Yellow'],
          ['Which color is opposite BLUE on the color wheel?', 'Orange', 'Green', 'Purple', 'Red'],
          ['Which color is opposite YELLOW on the color wheel?', 'Purple', 'Green', 'Orange', 'Blue'],
          ['Colors opposite each other on the color wheel are called ___ colors.', 'complementary', 'primary', 'warm', 'neutral'],
          ['Mixing red and orange makes ___', 'red-orange', 'green', 'blue-green', 'gray'],
          ['Which is a tertiary color (a primary mixed with a secondary)?', 'blue-green', 'blue', 'green', 'orange'],
          ['A color mixed with white is called a ___', 'tint', 'shade', 'texture', 'pattern'],
          ['A color mixed with black is called a ___', 'shade', 'tint', 'texture', 'primary'],
          ['Which is a neutral color?', 'Gray', 'Red', 'Orange', 'Green'],
          ['How many colors are on a basic 12-part color wheel?', '12', '3', '6', '24'],
        ],
        'Art words': [
          ['A painting of objects like fruit, flowers, or vases is called a ___', 'still life', 'portrait', 'landscape', 'mural'],
          ['A picture made from many small pieces of tile or glass is a ___', 'mosaic', 'sketch', 'portrait', 'print'],
          ['Art made by gluing different papers and materials onto a surface is a ___', 'collage', 'sculpture', 'sketch', 'mural'],
          ['When both sides of a picture match, like a butterfly, it has ___', 'symmetry', 'texture', 'value', 'shadow'],
          ['How something feels, or looks like it would feel, is its ___', 'texture', 'color', 'shape', 'size'],
          ['The line where the sky seems to meet the land is the ___ line.', 'horizon', 'zigzag', 'dotted', 'outline'],
          ['The part of a picture that looks closest to you is the ___', 'foreground', 'background', 'horizon', 'border'],
          ['The part of a picture that looks farthest away is the ___', 'background', 'foreground', 'frame', 'title'],
          ['A quick, rough drawing is called a ___', 'sketch', 'statue', 'mosaic', 'mural'],
          ['A dark shape or outline against a light background is a ___', 'silhouette', 'rainbow', 'collage', 'tint'],
        ],
        'Famous artists': [
          ['Who painted the ceiling of the Sistine Chapel?', 'Michelangelo', 'Claude Monet', 'Andy Warhol', 'Frida Kahlo'],
          ['Georgia O\'Keeffe is famous for painting giant ___', 'flowers 🌸', 'robots', 'trains', 'castles'],
          ['Henri Matisse made colorful art by cutting shapes out of ___', 'paper', 'metal', 'stone', 'ice'],
          ['Andy Warhol made famous pop art pictures of ___', 'soup cans 🥫', 'dinosaurs', 'castles', 'mountains'],
          ['Jackson Pollock made paintings by ___ paint onto canvas.', 'dripping and splattering', 'gluing sand', 'stitching', 'stamping potatoes'],
          ['Claude Monet is known for a style of painting called ___', 'Impressionism', 'Cubism', 'Pop Art', 'Origami'],
          ['Pablo Picasso helped invent a style of art called ___', 'Cubism', 'Impressionism', 'Pop Art', 'Mosaic'],
          ['The "Mona Lisa" hangs in a famous museum in Paris called the ___', 'Louvre', 'White House', 'Colosseum', 'Big Ben'],
          ['"The Great Wave" is a famous print by Hokusai, an artist from ___ 🌊', 'Japan', 'France', 'Mexico', 'Spain'],
          ['Leonardo da Vinci was a painter and also an ___', 'inventor', 'astronaut', 'pilot', 'TV star'],
        ],
        'Crafts & tools': [
          ['The art of folding paper into shapes, like cranes, is called ___', 'origami', 'pottery', 'weaving', 'mosaic'],
          ['Origami comes from which country?', 'Japan', 'Brazil', 'Egypt', 'Canada'],
          ['Pottery is shaped from clay and then baked in a ___', 'kiln', 'freezer', 'sink', 'drawer'],
          ['Crossing threads or yarn over and under to make cloth is called ___', 'weaving', 'painting', 'carving', 'sketching'],
          ['A wheel that spins so an artist can shape clay is a ___ wheel.', 'potter\'s', 'Ferris', 'car', 'color'],
          ['Carving wood or stone into a 3D figure makes a ___', 'sculpture', 'collage', 'sketch', 'print'],
          ['Artists who design buildings are called ___', 'architects', 'pilots', 'chefs', 'dentists'],
          ['Which tool would an artist use to carve wood?', 'A chisel', 'A paintbrush', 'A crayon', 'A sponge'],
          ['Which material is see-through and used in stained glass windows?', 'Glass', 'Wood', 'Clay', 'Felt'],
          ['Paint mixed with water that looks soft and see-through is called ___', 'watercolor', 'chalk', 'clay', 'charcoal'],
        ],
      },
    },

    science: {
      g1: {
        'Five senses': [
          ['You see with your ___', 'eyes 👀', 'ears 👂', 'nose 👃', 'tongue 👅'],
          ['You hear with your ___', 'ears 👂', 'eyes 👀', 'nose 👃', 'hands ✋'],
          ['You smell with your ___', 'nose 👃', 'ears 👂', 'eyes 👀', 'feet 🦶'],
          ['You taste with your ___', 'tongue 👅', 'ears 👂', 'eyes 👀', 'elbow'],
          ['You feel how soft a kitten is with your sense of ___', 'touch ✋', 'smell 👃', 'hearing 👂', 'taste 👅'],
          ['How many main senses do people have?', '5', '3', '7', '10'],
        ],
        'Animals & homes': [
          ['Where does a fish live? 🐟', 'In water', 'In a tree', 'In the sand dunes', 'In the sky'],
          ['Which animal lives in the hot, dry desert?', 'Camel 🐪', 'Penguin 🐧', 'Polar bear', 'Whale 🐳'],
          ['Which animal lives where it is icy and very cold?', 'Penguin 🐧', 'Camel 🐪', 'Lion 🦁', 'Monkey 🐒'],
          ['Where do bees live? 🐝', 'In a hive', 'In a pond', 'In a cave of ice', 'In a shell'],
          ['Where does a bird lay its eggs?', 'In a nest 🪺', 'In a hive', 'In a pond', 'In a web'],
          ['Where does a whale live? 🐳', 'In the ocean', 'In the desert', 'In a forest', 'In a barn'],
          ['Which animal has feathers?', 'Bird 🐦', 'Dog 🐶', 'Fish 🐟', 'Frog 🐸'],
          ['Which animal hatches from an egg?', 'Chick 🐣', 'Puppy 🐶', 'Kitten 🐱', 'Calf 🐮'],
          ['A baby dog is called a ___', 'puppy', 'kitten', 'calf', 'cub'],
          ['A baby cat is called a ___', 'kitten', 'puppy', 'lamb', 'chick'],
          ['A baby sheep is called a ___', 'lamb', 'puppy', 'kitten', 'tadpole'],
          ['A baby frog is called a ___', 'tadpole', 'cub', 'calf', 'kitten'],
          ['Which animal can fly?', 'Bird 🐦', 'Horse 🐴', 'Cow 🐮', 'Pig 🐷'],
        ],
        'Plants': [
          ['What do plants need to grow?', 'Sunlight and water ☀️💧', 'Candy and soda', 'Only darkness'],
          ['Which part of a plant holds it in the soil and drinks water?', 'Roots', 'Flower', 'Leaf', 'Fruit'],
          ['What grows into a new plant? 🌱', 'A seed', 'A rock', 'A shoe', 'A cloud'],
          ['Which part of a plant is usually green and flat and catches sunlight?', 'Leaf 🍃', 'Root', 'Seed', 'Rock'],
          ['Which of these grows on a tree?', 'Apple 🍎', 'Cheese 🧀', 'Egg 🥚', 'Milk 🥛'],
          ['Which part of a plant is often colorful and smells nice? 🌸', 'Flower', 'Root', 'Stem', 'Seed'],
          ['When you cut open an apple 🍎, what do you find inside?', 'Seeds', 'Rocks', 'Feathers', 'Shells'],
          ['Which part of a plant carries water up from the roots to the leaves?', 'Stem', 'Petal', 'Seed', 'Fruit'],
        ],
        'Weather & seasons': [
          ['What falls from clouds when it rains?', 'Drops of water 💧', 'Sand', 'Leaves'],
          ['Snow falls when the weather is ___', 'cold ❄️', 'very hot', 'dry and sunny'],
          ['What should you wear on a rainy day?', 'A raincoat ☔', 'Sunglasses only', 'A swimsuit'],
          ['In which season do many trees lose their leaves?', 'Fall 🍂', 'Summer', 'Spring'],
          ['Which season is usually the coldest?', 'Winter ❄️', 'Summer', 'Spring'],
          ['In which season do many flowers start to bloom?', 'Spring 🌷', 'Winter', 'Fall'],
          ['How many seasons are there in a year?', '4', '2', '6', '12'],
          ['Which season is usually the hottest?', 'Summer ☀️', 'Winter', 'Fall'],
        ],
        'Sky & world': [
          ['What gives Earth light and heat during the day?', 'The Sun ☀️', 'The Moon 🌙', 'The clouds'],
          ['What do we often see in the sky at night that seems to change shape?', 'The Moon 🌙', 'The Sun ☀️', 'A rainbow'],
          ['Which one is living?', 'Tree 🌳', 'Rock 🪨', 'Chair 🪑', 'Cup'],
          ['Which one is NOT living?', 'Rock 🪨', 'Dog 🐶', 'Flower 🌸', 'Bird 🐦'],
          ['Living things need ___ to stay alive.', 'food and water', 'toys', 'paint', 'music'],
          ['What do you see in the sky after rain when the Sun comes out?', 'A rainbow 🌈', 'A snowman', 'A volcano'],
        ],
      },
      g2: {
        'Solids, liquids, gases': [
          ['Ice is a ___ 🧊', 'solid', 'liquid', 'gas'],
          ['Water from the faucet is a ___ 💧', 'liquid', 'solid', 'gas'],
          ['Steam from a hot pot is a ___', 'gas', 'solid', 'liquid'],
          ['When ice gets warm, it ___', 'melts', 'freezes', 'grows'],
          ['When water gets very cold, it ___', 'freezes', 'melts', 'boils'],
          ['Which one is a solid?', 'A rock 🪨', 'Milk', 'Air', 'Juice'],
          ['Which one is a gas?', 'Air', 'Wood', 'Milk', 'Stone'],
          ['Which one is a liquid?', 'Juice 🧃', 'A brick', 'A spoon', 'Air'],
        ],
        'Life cycles': [
          ['A caterpillar grows up to become a ___', 'butterfly 🦋', 'bee', 'bird', 'spider'],
          ['What does a caterpillar make before it becomes a butterfly?', 'A chrysalis', 'A nest', 'A web', 'A hive'],
          ['What comes FIRST in a butterfly\'s life?', 'Egg', 'Caterpillar', 'Chrysalis', 'Butterfly'],
          ['A tadpole grows up to become a ___', 'frog 🐸', 'fish', 'snake', 'turtle'],
          ['Baby chickens hatch from ___', 'eggs 🥚', 'seeds', 'flowers', 'cocoons'],
          ['A seed sprouts and grows into a ___', 'plant 🌱', 'rock', 'bird', 'cloud'],
        ],
        'Animals': [
          ['An animal that eats only plants is a ___', 'herbivore', 'carnivore', 'omnivore'],
          ['An animal that eats only meat is a ___', 'carnivore', 'herbivore', 'omnivore'],
          ['Which animal is a herbivore (plant eater)?', 'Cow 🐄', 'Lion 🦁', 'Shark 🦈', 'Wolf 🐺'],
          ['Which animal is a mammal (has fur and feeds its babies milk)?', 'Dog 🐶', 'Snake 🐍', 'Frog 🐸', 'Fish 🐟'],
          ['Which animal is a reptile?', 'Turtle 🐢', 'Frog 🐸', 'Cat 🐱', 'Robin 🐦'],
          ['Which animal is an insect?', 'Ant 🐜', 'Spider 🕷️', 'Worm 🪱', 'Snail 🐌'],
          ['How many legs does an insect have?', '6', '8', '4', '10'],
          ['How many legs does a spider have? 🕷️', '8', '6', '4', '10'],
          ['When bears sleep through the winter, we say they ___', 'hibernate', 'migrate', 'hatch', 'melt'],
          ['When birds fly to warmer places for the winter, we say they ___', 'migrate', 'hibernate', 'freeze', 'hatch'],
          ['Bees help flowers make seeds by carrying ___ from flower to flower.', 'pollen', 'water', 'dirt', 'sand'],
          ['Which part of a plant makes seeds?', 'The flower', 'The roots', 'The bark', 'The soil'],
          ['Roots take in water from the ___', 'soil', 'sky', 'leaves', 'flowers'],
        ],
        'Weather tools': [
          ['A thermometer 🌡️ tells you ___', 'how hot or cold it is', 'how much it rained', 'which way the wind blows', 'what time it is'],
          ['A rain gauge tells you ___', 'how much rain fell', 'how hot it is', 'how windy it is', 'how tall a tree is'],
          ['A weather vane shows ___', 'which way the wind blows', 'how much it rained', 'how hot it is', 'how heavy something is'],
          ['Big, dark gray clouds often mean ___ is coming.', 'rain', 'a rainbow only', 'a heat wave'],
        ],
        'Space & tools': [
          ['The Sun is a ___', 'star ⭐', 'planet', 'moon', 'cloud'],
          ['Earth is a ___', 'planet 🌍', 'star', 'moon', 'comet'],
          ['What does our Moon travel around?', 'Earth', 'Mars', 'Jupiter', 'Venus'],
          ['Earth spins around one time every ___', 'day', 'week', 'month', 'hour'],
          ['It is daytime on your side of Earth when it faces the ___', 'Sun ☀️', 'Moon 🌙', 'stars only'],
          ['A magnet will pick up a ___ 🧲', 'paper clip 📎', 'wooden block', 'rubber band', 'plastic cup'],
          ['Which tool helps you see tiny things up close?', 'Magnifying glass 🔍', 'Ruler', 'Spoon', 'Pillow'],
          ['A group of stars that makes a picture in the sky is a ___', 'constellation', 'comet', 'cloud', 'planet'],
          ['Which is closest to Earth?', 'The Moon 🌙', 'The Sun', 'Mars', 'Jupiter'],
        ],
      },
      g3: {
        'Forces & magnets': [
          ['A push or a pull is called a ___', 'force', 'sound', 'color', 'shadow'],
          ['What pulls things down toward the ground?', 'Gravity', 'Friction', 'Light', 'Wind'],
          ['What force slows things down when two surfaces rub together?', 'Friction', 'Gravity', 'Magnetism', 'Sound'],
          ['If you put two magnets\' NORTH ends together, they ___', 'push apart', 'stick together', 'melt', 'change color'],
          ['A magnet\'s north end and another magnet\'s south end will ___', 'pull together', 'push apart', 'get hot', 'disappear'],
          ['Which object would a magnet attract? 🧲', 'An iron nail', 'A plastic spoon', 'A wooden pencil', 'A glass marble'],
          ['A ball rolls farther on smooth ice than on grass because ice has less ___', 'friction', 'gravity', 'color', 'water'],
          ['Sound is made when things ___', 'vibrate', 'freeze', 'glow', 'shrink'],
          ['Which energy source will never run out?', 'Sunlight ☀️', 'Coal', 'Oil', 'Gasoline'],
        ],
        'Solar system': [
          ['How many planets are in our solar system?', '8', '9', '7', '10'],
          ['Which planet is the largest?', 'Jupiter', 'Mars', 'Earth', 'Mercury'],
          ['Which planet is closest to the Sun?', 'Mercury', 'Venus', 'Earth', 'Neptune'],
          ['Which planet is called the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Neptune'],
          ['Earth is the ___ planet from the Sun.', '3rd', '1st', '5th', '8th'],
          ['Which planet is famous for its big, bright rings? 🪐', 'Saturn', 'Mars', 'Mercury', 'Venus'],
          ['About how long does it take Earth to travel once around the Sun?', 'One year', 'One day', 'One week', 'One hour'],
          ['What causes day and night?', 'Earth spinning', 'The Sun turning off', 'Clouds covering the Sun', 'The Moon blocking the Sun'],
          ['The Moon shines at night because it ___', 'reflects sunlight', 'makes its own fire', 'is covered in lights', 'is a star'],
        ],
        'Life science': [
          ['Butterflies go through 4 stages: egg, larva, pupa, adult. What is the larva?', 'Caterpillar', 'Chrysalis', 'Butterfly', 'Egg'],
          ['Babies get traits like eye color from their ___', 'parents', 'friends', 'food', 'toys'],
          ['A camel\'s hump stores ___ 🐪', 'fat', 'water', 'sand', 'milk'],
          ['Webbed feet help a duck ___ 🦆', 'swim', 'climb trees', 'dig tunnels', 'see at night'],
          ['A polar bear\'s thick fur helps it ___', 'stay warm', 'stay cool', 'fly', 'see far'],
          ['Fossils are ___', 'remains or traces of living things from long ago', 'brand-new rocks', 'kinds of clouds', 'shiny metals'],
          ['Where does a plant make most of its food?', 'In its leaves', 'In its roots', 'In the soil', 'In its seeds'],
          ['A special feature that helps an animal survive is called an ___', 'adaptation', 'invention', 'instrument', 'illusion'],
        ],
        'Water & weather': [
          ['When water heats up and turns into vapor, it is called ___', 'evaporation', 'condensation', 'precipitation', 'freezing'],
          ['When water vapor cools and forms drops, like clouds, it is called ___', 'condensation', 'evaporation', 'melting', 'erosion'],
          ['Rain, snow, sleet, and hail are all kinds of ___', 'precipitation', 'evaporation', 'condensation', 'erosion'],
          ['Water freezes at ___ degrees Fahrenheit.', '32', '100', '212', '50'],
          ['Water boils at ___ degrees Celsius.', '100', '0', '32', '50'],
          ['The usual weather in a place over many years is called its ___', 'climate', 'forecast', 'season', 'storm'],
          ['A scientist who studies and predicts weather is a ___', 'meteorologist', 'dentist', 'chef', 'pilot'],
        ],
        'Human body': [
          ['About how many bones does an adult human have?', '206', '50', '1,000', '12'],
          ['What pumps blood all through your body? ❤️', 'The heart', 'The lungs', 'The stomach', 'The brain'],
          ['Which organs help you breathe?', 'Lungs 🫁', 'Heart', 'Stomach', 'Bones'],
          ['What does your skeleton do?', 'Supports and protects your body', 'Digests food', 'Pumps blood', 'Helps you smell'],
          ['Which organ controls your thinking and your whole body? 🧠', 'The brain', 'The stomach', 'The lungs', 'The skin'],
          ['What is the largest organ of the human body?', 'Skin', 'Heart', 'Brain', 'Liver'],
          ['What do your muscles help you do?', 'Move', 'See colors', 'Breathe underwater', 'Grow hair'],
        ],
      },
    },

    history: {
      g1: {
        'American symbols': [
          ['What colors are on the American flag? 🇺🇸', 'Red, white, and blue', 'Green, yellow, and black', 'Red and green', 'Purple and orange'],
          ['How many stars are on the American flag?', '50', '13', '10', '100'],
          ['What do the 50 stars on the flag stand for?', 'The 50 states', '50 presidents', '50 cities', '50 birthdays'],
          ['What is the national bird of the United States?', 'Bald eagle 🦅', 'Robin', 'Pigeon', 'Parrot 🦜'],
          ['The Statue of Liberty 🗽 is in which state?', 'New York', 'Florida', 'Texas', 'California'],
          ['Who lives and works in the White House?', 'The President', 'The mayor', 'A teacher', 'The mail carrier'],
          ['The Liberty Bell 🔔 has a famous ___', 'crack', 'flag', 'clock', 'door'],
          ['What do we say to show respect for the American flag?', 'The Pledge of Allegiance', 'A riddle', 'The alphabet', 'A recipe'],
          ['Uncle Sam often wears a hat with ___ on it.', 'stars and stripes', 'polka dots', 'flowers', 'dinosaurs'],
        ],
        'Holidays': [
          ['The Fourth of July is also called ___ 🎆', 'Independence Day', 'Thanksgiving', 'New Year\'s Day', 'Halloween'],
          ['Which holiday has a big turkey dinner and giving thanks? 🦃', 'Thanksgiving', 'Halloween', 'Fourth of July', 'Valentine\'s Day'],
          ['Thanksgiving is in which month?', 'November', 'July', 'March', 'June'],
          ['Which holiday celebrates America\'s birthday with fireworks?', 'Fourth of July', 'Thanksgiving', 'Valentine\'s Day', 'Earth Day'],
          ['Martin Luther King Jr. Day is in which month?', 'January', 'July', 'October', 'May'],
          ['Veterans Day honors people who served in the ___', 'military', 'kitchen', 'zoo', 'library'],
          ['Presidents\' Day is in which month?', 'February', 'August', 'December', 'June'],
          ['On Earth Day 🌎, people celebrate by ___', 'taking care of our planet', 'eating turkey', 'wearing costumes', 'opening presents'],
        ],
        'Presidents': [
          ['Who was the first President of the United States?', 'George Washington', 'Abraham Lincoln', 'Benjamin Franklin', 'Martin Luther King Jr.'],
          ['Abraham Lincoln was known as "Honest ___"', 'Abe', 'Al', 'Andy', 'Art'],
          ['Whose face is on the penny? 🪙', 'Abraham Lincoln', 'George Washington', 'Benjamin Franklin', 'Paul Revere'],
          ['Whose face is on the one-dollar bill? 💵', 'George Washington', 'Abraham Lincoln', 'Benjamin Franklin', 'Thomas Edison'],
          ['George Washington is called the "Father of His ___"', 'Country', 'School', 'Farm', 'Team'],
          ['Abraham Lincoln was famous for wearing a tall ___ 🎩', 'top hat', 'crown', 'helmet', 'baseball cap'],
        ],
        'Community helpers': [
          ['Who puts out fires? 🚒', 'Firefighter', 'Baker', 'Pilot', 'Librarian'],
          ['Who helps you when you are sick? 🩺', 'Doctor', 'Farmer', 'Pilot', 'Chef'],
          ['Who brings letters to your house? 📬', 'Mail carrier', 'Chef', 'Dentist', 'Pilot'],
          ['Who grows food on a farm? 🚜', 'Farmer', 'Dentist', 'Pilot', 'Mail carrier'],
          ['Who flies an airplane? ✈️', 'Pilot', 'Farmer', 'Baker', 'Doctor'],
          ['Who helps keep your teeth healthy? 🦷', 'Dentist', 'Firefighter', 'Farmer', 'Pilot'],
          ['Who helps you find books at the library? 📚', 'Librarian', 'Firefighter', 'Pilot', 'Farmer'],
          ['Who keeps people safe and helps direct traffic? 👮', 'Police officer', 'Baker', 'Dentist', 'Artist'],
          ['Who bakes bread and cakes? 🍞', 'Baker', 'Pilot', 'Dentist', 'Firefighter'],
          ['Who fixes cars when they break? 🔧', 'Mechanic', 'Librarian', 'Baker', 'Doctor'],
        ],
        'Long ago & today': [
          ['Long ago, before electric lights, people used ___ for light at night.', 'candles 🕯️', 'phones', 'TVs', 'light bulbs'],
          ['Long ago, many people traveled from town to town by ___', 'horse and wagon 🐎', 'airplane', 'rocket', 'electric car'],
          ['Which one is from TODAY, not long ago?', 'Tablet computer 📱', 'Butter churn', 'Covered wagon', 'Quill pen'],
          ['Which word means a day that already happened?', 'Yesterday', 'Tomorrow', 'Next week'],
          ['The day after today is called ___', 'tomorrow', 'yesterday', 'last week'],
          ['A line that shows events in the order they happened is a ___', 'timeline', 'jump rope', 'clothesline', 'finish line'],
          ['Long ago, kids often learned in a ___ with all ages in one room.', 'one-room schoolhouse', 'spaceship', 'shopping mall', 'video game'],
        ],
      },
      g2: {
        'Famous Americans': [
          ['Who gave the famous "I Have a Dream" speech?', 'Martin Luther King Jr.', 'Abraham Lincoln', 'George Washington', 'Neil Armstrong'],
          ['Rosa Parks is famous for refusing to give up her seat on a ___', 'bus 🚌', 'train', 'plane', 'boat'],
          ['Harriet Tubman led enslaved people to freedom on the ___', 'Underground Railroad', 'Oregon Trail', 'Mayflower', 'Golden Gate Bridge'],
          ['Who was the first person to walk on the Moon? 🌙', 'Neil Armstrong', 'Amelia Earhart', 'Benjamin Franklin', 'George Washington'],
          ['Amelia Earhart was a famous ___', 'pilot ✈️', 'chef', 'president', 'painter'],
          ['The Wright brothers built and flew the first powered ___', 'airplane', 'car', 'train', 'rocket'],
          ['Benjamin Franklin flew a kite in a storm to learn about ___', 'electricity ⚡', 'rainbows', 'dinosaurs', 'volcanoes'],
          ['George Washington Carver found hundreds of uses for the ___', 'peanut 🥜', 'potato', 'apple', 'banana'],
          ['Sacagawea helped guide which famous explorers?', 'Lewis and Clark', 'The Wright brothers', 'The Pilgrims', 'The astronauts'],
          ['Thomas Edison is famous for inventing a long-lasting ___', 'light bulb 💡', 'telephone', 'airplane', 'bicycle'],
          ['Martin Luther King Jr. worked for equal rights using ___', 'peaceful protest', 'fighting', 'magic', 'secret codes'],
          ['Helen Keller could not see or hear, but she learned to read, write, and ___', 'speak', 'fly a plane', 'drive a train', 'see again'],
        ],
        'Native Americans': [
          ['Who lived in North America long before explorers came from Europe?', 'Native Americans', 'Pilgrims', 'Astronauts', 'Cowboys'],
          ['Native Americans belong to ___', 'many different nations, each with its own culture', 'just one tribe', 'one big city', 'one family'],
          ['Many Plains peoples, like the Lakota, depended on the ___ for food and clothing.', 'bison (buffalo)', 'penguin', 'camel', 'kangaroo'],
          ['The Haudenosaunee (Iroquois) lived in long wooden homes called ___', 'longhouses', 'igloos', 'castles', 'skyscrapers'],
          ['Pueblo peoples of the Southwest built homes from sun-dried mud bricks called ___', 'adobe', 'glass', 'steel', 'ice'],
          ['Which crop did many Native American peoples grow?', 'Corn 🌽', 'Bananas', 'Oranges', 'Coffee'],
          ['Sequoyah created a writing system for the ___ language.', 'Cherokee', 'French', 'Spanish', 'English'],
        ],
        'Landmarks': [
          ['Mount Rushmore shows the faces of how many presidents?', '4', '2', '3', '5'],
          ['Which president is carved on Mount Rushmore?', 'Abraham Lincoln', 'Benjamin Franklin', 'Paul Revere', 'Neil Armstrong'],
          ['The Golden Gate Bridge 🌉 is in which city?', 'San Francisco', 'New York City', 'Chicago', 'Miami'],
          ['The Statue of Liberty was a gift to the United States from ___', 'France', 'England', 'Spain', 'Japan'],
          ['What is the capital of the United States?', 'Washington, D.C.', 'New York City', 'Los Angeles', 'Chicago'],
          ['The Liberty Bell is in which city?', 'Philadelphia', 'Los Angeles', 'Seattle', 'Miami'],
          ['The Grand Canyon was carved by the ___ River.', 'Colorado', 'Mississippi', 'Hudson', 'Ohio'],
          ['The tall stone tower built to honor George Washington is the ___', 'Washington Monument', 'Eiffel Tower', 'Space Needle', 'Leaning Tower'],
        ],
        'Communities & maps': [
          ['The leader of a city or town is the ___', 'mayor', 'president', 'principal', 'coach'],
          ['The leader of a state is the ___', 'governor', 'mayor', 'principal', 'captain'],
          ['The leader of the United States is the ___', 'President', 'mayor', 'governor', 'principal'],
          ['Rules that everyone in a community must follow are called ___', 'laws', 'games', 'recipes', 'songs'],
          ['The map symbol that shows North, South, East, and West is the ___ 🧭', 'compass rose', 'map key', 'title', 'scale'],
          ['On a map, the part that explains what the symbols mean is the ___', 'map key (legend)', 'compass rose', 'title', 'border'],
          ['Which direction is the opposite of North?', 'South', 'East', 'West', 'Up'],
          ['A ___ is a big area of land, like North America.', 'continent', 'puddle', 'street', 'backyard'],
        ],
        'Holidays & symbols': [
          ['Why do we celebrate the Fourth of July?', 'America declared independence', 'The first Thanksgiving', 'The first Moon landing', 'The end of school'],
          ['Memorial Day honors soldiers who ___', 'died serving our country', 'won sports games', 'built the first cars', 'became teachers'],
          ['How many stripes are on the American flag?', '13', '50', '10', '7'],
          ['The 13 stripes on the flag stand for the first 13 ___', 'colonies', 'presidents', 'cities', 'rivers'],
          ['When we say the Pledge of Allegiance, we face the ___', 'flag', 'door', 'window', 'clock'],
        ],
      },
      g3: {
        'Early America': [
          ['Christopher Columbus first sailed across the Atlantic Ocean in ___', '1492', '1776', '1620', '1900'],
          ['The first permanent English colony, Jamestown (1607), was in present-day ___', 'Virginia', 'Massachusetts', 'Texas', 'California'],
          ['The Pilgrims sailed to America on the ___ in 1620.', 'Mayflower', 'Titanic', 'Santa Maria', 'Half Moon'],
          ['Where did the Pilgrims build their colony?', 'Plymouth', 'Jamestown', 'Philadelphia', 'Chicago'],
          ['Which Native American people helped the Pilgrims and shared the 1621 harvest feast?', 'Wampanoag', 'Lakota', 'Navajo', 'Cherokee'],
          ['Tisquantum (Squanto) helped the Pilgrims learn to grow ___', 'corn 🌽', 'rice', 'oranges', 'bananas'],
          ['Pocahontas was the daughter of a leader of the ___ people.', 'Powhatan', 'Wampanoag', 'Lakota', 'Inca'],
          ['How many original colonies were there?', '13', '50', '10', '7'],
        ],
        'Revolution': [
          ['In what year was the Declaration of Independence adopted?', '1776', '1492', '1620', '1865'],
          ['Who wrote most of the Declaration of Independence?', 'Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'Paul Revere'],
          ['The 13 colonies declared independence from ___', 'Great Britain', 'France', 'Spain', 'Mexico'],
          ['The war the colonies fought to become free from Britain is called the ___', 'American Revolution', 'Civil War', 'Space Race', 'Gold Rush'],
          ['Who led the American army in the Revolutionary War?', 'George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Neil Armstrong'],
          ['Paul Revere rode at night to warn colonists that British ___ were coming.', 'soldiers', 'kings', 'ships full of tea', 'farmers'],
          ['Benjamin Franklin was an inventor, a writer, and a ___', 'founding leader of the country', 'astronaut', 'pilot', 'movie star'],
          ['Who was the first President to live in the White House?', 'John Adams', 'George Washington', 'Abraham Lincoln', 'Thomas Edison'],
        ],
        'Government': [
          ['The plan for how the U.S. government works is called the ___', 'Constitution', 'Declaration of Independence', 'Pledge of Allegiance', 'National Anthem'],
          ['Which famous document begins with "We the People"?', 'The Constitution', 'The Declaration of Independence', 'The Pledge of Allegiance', 'The Star-Spangled Banner'],
          ['How many branches does the U.S. government have?', '3', '2', '4', '5'],
          ['Which part of the government makes the laws?', 'Congress', 'The President', 'The Supreme Court', 'The mayor'],
          ['Who leads the executive branch?', 'The President', 'The Chief Justice', 'The governor', 'The mayor'],
          ['The highest court in the United States is the ___', 'Supreme Court', 'Food Court', 'Tennis Court', 'Traffic Court'],
          ['Congress has two parts: the Senate and the ___', 'House of Representatives', 'White House', 'Supreme Court', 'Cabinet'],
          ['The first 10 amendments to the Constitution are called the ___', 'Bill of Rights', 'Mayflower Compact', 'Pledge', 'Gettysburg Address'],
          ['Freedom of speech is protected by the ___ Amendment.', 'First', 'Fifth', 'Tenth', 'Twentieth'],
        ],
        'Our country grows': [
          ['How many states are in the United States?', '50', '13', '48', '52'],
          ['Which state was the 50th to join the United States?', 'Hawaii', 'Alaska', 'Texas', 'Florida'],
          ['Which is the largest U.S. state by area?', 'Alaska', 'Texas', 'California', 'Rhode Island'],
          ['Lewis and Clark explored land the U.S. bought called the ___', 'Louisiana Purchase', 'Gold Rush', 'Great Lakes', 'Mayflower'],
          ['Which president bought the Louisiana Territory from France?', 'Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'John Adams'],
          ['Lewis and Clark traveled west all the way to the ___ Ocean.', 'Pacific', 'Atlantic', 'Indian', 'Arctic'],
          ['Ellis Island in New York was where many ___ arrived in America.', 'immigrants', 'astronauts', 'dinosaurs', 'pilots'],
          ['Who wrote the words to "The Star-Spangled Banner"?', 'Francis Scott Key', 'Thomas Jefferson', 'Paul Revere', 'George Washington'],
        ],
        'Famous leaders': [
          ['Abraham Lincoln was President during the ___', 'Civil War', 'Revolutionary War', 'Space Race', 'Gold Rush'],
          ['Abraham Lincoln was the ___ President.', '16th', '1st', '3rd', '50th'],
          ['Lincoln\'s Emancipation Proclamation was about freeing ___', 'enslaved people', 'British soldiers', 'the Pilgrims', 'zoo animals'],
          ['Harriet Tubman escaped slavery and then helped others escape. She was very ___', 'brave', 'lazy', 'selfish', 'forgetful'],
          ['Martin Luther King Jr. led the March on Washington in which city?', 'Washington, D.C.', 'Los Angeles', 'Miami', 'Seattle'],
          ['Rosa Parks\' famous bus protest happened in Montgomery, in the state of ___', 'Alabama', 'Alaska', 'Maine', 'Oregon'],
          ['Who is known as the "Father of Our Country"?', 'George Washington', 'Thomas Edison', 'Paul Revere', 'Neil Armstrong'],
          ['Thomas Jefferson was the ___ President.', '3rd', '1st', '16th', '10th'],
        ],
      },
    },
  };

  window.WizardBanks = { BANKS, shuffle };
})();
