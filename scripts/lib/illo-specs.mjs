// One line per recipe illustration: [kind, background, description, options].
// The description becomes the SVG <title> and the image alt text.
// Kinds and their options are defined in scripts/lib/illo-kinds.mjs.

const G = '#3f8a3c'; // herb green
const LIME = '#6aa84f';

export const SPECS = {
  // ---- Soups and stews ----
  'black-bean-soup': ['bowl', '#efdcc9', 'A bowl of black bean soup with sour cream, cilantro and a lime wedge', { base: '#3a2a26', bits: [['blackbean', 30, '#1f1716'], ['dice', 8, '#f2e9d8'], ['leaf', 12, G]], swirl: '#f7efe0', sides: [['lime', 335, 235]] }],
  'butternut-squash-soup': ['bowl', '#f2e4c9', 'A bowl of smooth orange squash soup with a cream swirl and toasted seeds', { base: '#e98a2e', swirl: '#fbe9dc', bits: [['seed', 20, '#6b8a3a'], ['herb', 8, G]], sides: [['bread', 335, 230]] }],
  'chicken-noodle-soup': ['bowl', '#dfe8ef', 'A bowl of chicken noodle soup with carrots, celery and parsley', { base: '#f1d68a', bits: [['noodle', 22, '#fbeebf'], ['chicken', 10], ['coin', 12, '#f08a33'], ['dice', 8, '#b6d98a'], ['herb', 14, G]] }],
  'chicken-tortilla-soup': ['bowl', '#f4e3c0', 'A bowl of red tortilla soup topped with tortilla strips, avocado and lime', { base: '#c8502f', bits: [['chicken', 8], ['corn', 12], ['stick', 12, '#f0c060'], ['chunk', 5, '#9ccf6a'], ['leaf', 10, G]], sides: [['lime', 335, 235]] }],
  'corn-chowder': ['bowl', '#f6e7c8', 'A bowl of creamy corn chowder with potatoes, bacon bits and chives', { base: '#f3dfa0', bits: [['corn', 40], ['dice', 10, '#f6ecd0'], ['crumb', 10, '#a8452a'], ['ring', 12, '#5aa54a']] }],
  'egg-drop-soup': ['bowl', '#f5e2c4', 'A bowl of golden egg drop soup with ribbons of egg and green onion', { base: '#f0c64e', bits: [['swirl', 5, '#fff3b8'], ['ring', 14, '#5aa54a']], sides: [['spoon', 330, 230]] }],
  'french-onion-soup': ['bowl', '#e8e1d2', 'A crock of French onion soup under a bubbling cheese-topped crust', { base: '#e3b04f', bits: [['blob', 22, '#f3d27a'], ['blob', 10, '#c98a3e'], ['herb', 6, G]], under: [['napkinBlue']] }],
  'italian-wedding-soup': ['bowl', '#dde8e0', 'A bowl of wedding soup with tiny meatballs, greens and pasta', { base: '#e9c96a', bits: [['ball', 12, '#8a4a2c'], ['spinach', 8], ['coin', 8, '#f08a33'], ['grain', 20, '#fbeebf']] }],
  minestrone: ['bowl', '#f1e0cf', 'A bowl of minestrone with beans, pasta and vegetables', { base: '#c8582f', bits: [['pasta', 10, '#f0c060'], ['kidney', 10, '#f0e6cf'], ['dice', 10, '#f08a33'], ['dice', 10, '#9ccf6a'], ['leaf', 8, G]], sides: [['bread', 335, 230]] }],
  'miso-soup': ['bowl', '#e2ecd5', 'A bowl of miso soup with tofu cubes, seaweed and green onion', { base: '#d9b068', bits: [['paneer', 12], ['nori', 10], ['ring', 14, '#5aa54a']], sides: [['spoon', 330, 230]] }],
  'pasta-e-fagioli': ['bowl', '#f3e6d3', 'A bowl of pasta and bean soup with Parmesan and parsley', { base: '#c46a36', bits: [['pasta', 14, '#f0c060'], ['kidney', 16, '#f0e6cf'], ['dice', 8, '#f08a33'], ['herb', 12, G], ['cheese', 10, '#fbf1d4']] }],
  'potato-leek-soup': ['bowl', '#e3e8d6', 'A bowl of creamy potato leek soup with chives', { base: '#efe6c2', swirl: '#fffaf0', bits: [['ring', 16, '#6aa84f'], ['dot', 10, '#6b5a3a']] }],
  'vegetable-barley-soup': ['bowl', '#efe3d6', 'A bowl of vegetable barley soup with carrots and green beans', { base: '#c9793a', bits: [['grain', 40, '#efe0b8'], ['coin', 12, '#f08a33'], ['greenbean', 6], ['dice', 8, '#b6d98a'], ['herb', 10, G]] }],
  'white-bean-kale-soup': ['bowl', '#dfeadd', 'A bowl of white bean soup with kale', { base: '#e6c77a', bits: [['kidney', 24, '#f6efdc'], ['kale', 10], ['coin', 6, '#f08a33']], sides: [['bread', 335, 230]] }],
  gazpacho: ['bowl', '#f2d9cc', 'A bowl of chilled tomato gazpacho topped with diced cucumber and pepper', { base: '#d9392b', swirl: '#e8a080', bits: [['dice', 14, '#9ccf6a'], ['dice', 10, '#f3e6c0'], ['herb', 8, G]], sides: [['cucumber', 335, 230]] }],
  'beef-stew': ['bowl', '#efdcc9', 'A bowl of beef stew with carrots and potatoes', { base: '#7a3a24', bits: [['chunk', 14, '#5a2e1a'], ['potato', 8], ['coin', 12, '#f08a33'], ['herb', 12, G]], sides: [['bread', 335, 230]] }],
  'classic-beef-chili': ['bowl', '#f2d9cc', 'A bowl of beef chili with cheddar, sour cream and green onion', { base: '#8a2f1c', bits: [['crumb', 30, '#5a2418'], ['kidney', 16], ['cheese', 16, '#f0a93a'], ['ring', 10, '#5aa54a']], swirl: '#f7efe0', sides: [['chips', 335, 235]] }],
  'chicken-and-dumplings': ['bowl', '#f6e7c8', 'A bowl of chicken stew with fluffy dumplings, carrots and peas', { base: '#e9c96a', bits: [['dumpling', 6], ['chicken', 8], ['coin', 8, '#f08a33'], ['pea', 10], ['herb', 10, G]] }],
  'rice-congee': ['bowl', '#e8e1d2', 'A bowl of rice porridge with ginger, green onion and a drizzle of soy', { base: '#f6f0de', bits: [['grain', 50, '#fffaf0'], ['stick', 10, '#e8c98a'], ['ring', 16, '#5aa54a'], ['dot', 10, '#6b3a24']], sides: [['soy', 335, 230]] }],
  'quick-miso-ramen': ['bowl', '#dfe8ef', 'A bowl of miso ramen with noodles, a soft egg, corn and green onion', { base: '#d9a44e', bits: [['noodle', 26, '#f7dc8a'], ['corn', 16], ['ring', 14, '#5aa54a'], ['nori', 3]], sides: [['egg', 185, 120], ['chopsticks', 330, 150]] }],

  // ---- Curries, dals and braises in bowls ----
  'aloo-gobi': ['bowl', '#f5e2c4', 'A bowl of turmeric potatoes and cauliflower with cilantro', { base: '#e6b33a', bits: [['potato', 10], ['cauli', 8], ['leaf', 12, G]], sides: [['rice', 330, 225]] }],
  'butter-chicken': ['bowl', '#f1e0cf', 'A bowl of creamy orange butter chicken with cilantro, beside rice', { base: '#e0702e', swirl: '#fbe9dc', bits: [['chicken', 14], ['leaf', 10, G]], sides: [['rice', 330, 225]] }],
  'chana-masala': ['bowl', '#efdcc9', 'A bowl of chickpeas in a spiced tomato sauce with cilantro and lemon', { base: '#b8502a', bits: [['chickpea', 30], ['leaf', 10, G], ['onionring', 4, '#f3e6ef']], sides: [['lemon', 330, 80], ['rice', 330, 225]] }],
  'chicken-tikka-masala': ['bowl', '#f2dfd0', 'A bowl of chicken tikka masala with a cream swirl, beside rice', { base: '#d5552b', swirl: '#fbe9dc', bits: [['chicken', 14], ['leaf', 10, G]], sides: [['rice', 330, 225]] }],
  'saag-paneer': ['bowl', '#e2ecd5', 'A bowl of creamy spinach with golden paneer cubes', { base: '#4f7a2e', swirl: '#f7efe0', bits: [['paneer', 12], ['herb', 10, '#6fa84a']], sides: [['rice', 330, 225]] }],
  'tadka-dal': ['bowl', '#f6e7c8', 'A bowl of yellow dal topped with spiced oil, chiles and cilantro', { base: '#e9b53a', bits: [['lentil', 40, '#f3cf5e'], ['dot', 16, '#8a2f1c'], ['seed', 12, '#5a3a20'], ['leaf', 10, G]], sides: [['rice', 330, 225]] }],
  'thai-red-curry-shrimp': ['bowl', '#f2d9cc', 'A bowl of red curry with shrimp, peppers and basil, beside rice', { base: '#d9582f', swirl: '#fbe0cf', bits: [['shrimp', 8], ['pepper', 8, '#f2c230'], ['bigleaf', 6, '#2f7a34']], sides: [['rice', 330, 225], ['lime', 330, 75]] }],
  'chicken-adobo': ['bowl', '#efe3d6', 'Braised chicken adobo in a dark glossy sauce with bay leaves, beside rice', { base: '#6b3a24', bits: [['thigh', 4], ['bigleaf', 4, '#7a8a4a'], ['garlic', 6], ['dot', 12, '#2a1a14']], sides: [['rice', 330, 225]] }],
  'mapo-tofu': ['bowl', '#f2d9cc', 'A bowl of tofu cubes in a red chili sauce with green onion', { base: '#b8321f', bits: [['paneer', 16], ['crumb', 14, '#6b2a1a'], ['ring', 12, '#5aa54a']], sides: [['rice', 330, 225]] }],
  'mushroom-stroganoff': ['bowl', '#e8e1d2', 'Mushrooms in a creamy sauce over egg noodles with parsley', { base: '#f1d68a', bits: [['noodle', 14, '#fbeebf'], ['mushroom', 14], ['herb', 10, G]], swirl: '#e9dcc3' }],
  'beef-stroganoff': ['bowl', '#efe3d6', 'Beef and mushrooms in a creamy sauce over egg noodles', { base: '#f1d68a', bits: [['noodle', 14, '#fbeebf'], ['strip', 8], ['mushroom', 8], ['herb', 10, G]], swirl: '#e9dcc3' }],
  'mushroom-risotto': ['bowl', '#e8e2f0', 'A bowl of creamy mushroom risotto with Parmesan and thyme', { base: '#efe0b8', bits: [['grain', 60, '#fbf1d4'], ['mushroom', 10], ['cheese', 10, '#fffaf0'], ['herb', 8, G]] }],
  'lentil-salad': ['bowl', '#e3e8d6', 'A bowl of green lentils with diced vegetables and herbs', { base: '#6b6a3a', bits: [['lentil', 60, '#4a4a2a'], ['dice', 10, '#f08a33'], ['dice', 10, '#e9e0c0'], ['leaf', 12, G]] }],

  // ---- Rice, grains and salads ----
  'cilantro-lime-rice': ['bowl', '#e2ecd5', 'A bowl of white rice flecked with cilantro and lime zest', { base: '#fbf7ee', bits: [['grain', 90, '#fffaf0'], ['herb', 30, G]], sides: [['lime', 335, 235]] }],
  'fluffy-quinoa': ['bowl', '#f0e6cc', 'A bowl of fluffy quinoa', { base: '#e9d7a8', bits: [['seed', 140, '#f6e7bf'], ['herb', 8, G]] }],
  'mexican-rice': ['bowl', '#f4e3c0', 'A bowl of red-orange rice with peas and carrots', { base: '#e98f4a', bits: [['grain', 90, '#f6b378'], ['pea', 10], ['dice', 8, '#f08a33'], ['herb', 8, G]] }],
  'perfect-white-rice': ['bowl', '#dfe8ef', 'A bowl of fluffy white rice', { base: '#fbf7ee', bits: [['grain', 150, '#fffaf0']], sides: [['chopsticks', 330, 150]] }],
  'rice-pilaf': ['bowl', '#f2e4c9', 'A bowl of golden rice pilaf with toasted noodles and parsley', { base: '#f0d28a', bits: [['grain', 90, '#fff3cf'], ['stick', 10, '#c98a3e'], ['herb', 14, G]] }],
  'vegetable-fried-rice': ['bowl', '#f5e2c4', 'A bowl of fried rice with egg, peas, carrot and green onion', { base: '#f0d28a', bits: [['grain', 90, '#fff3cf'], ['blob', 10, '#f7d65a'], ['pea', 18], ['dice', 12, '#f08a33'], ['ring', 10]], sides: [['chopsticks', 330, 150]] }],
  'arroz-con-pollo': ['skillet', '#f4e3c0', 'A pan of yellow rice with chicken, peas and red peppers', { base: '#e7b84a', bits: [['grain', 90, '#f6d77a'], ['pea', 16], ['pepper', 8, '#d8392b']], top: [['thigh', 4], ['leaf', 10, G]], sides: [['lime', 340, 240]] }],
  'chicken-and-shrimp-paella': ['skillet', '#f1e0cf', 'A wide pan of saffron rice with shrimp, chicken, peas and lemon', { base: '#e9b13a', bits: [['grain', 90, '#f6d06a'], ['pea', 14], ['pepper', 6, '#d8392b'], ['chicken', 8]], top: [['shrimp', 8], ['wedge', 4]] }],
  'tabbouleh': ['bowl', '#e2ecd5', 'A bowl of parsley and bulgur salad with tomato and mint', { base: '#b8d27a', bits: [['herb', 90, '#3f8a3c'], ['seed', 30, '#e9d7a8'], ['dice', 14, '#d9392b'], ['leaf', 6, '#5aa84a']], sides: [['lemon', 335, 235]] }],
  fattoush: ['bowl', '#f2e4c9', 'A bowl of fattoush salad with crisp pita, cucumber, tomato and radish', { base: '#9fd46e', bits: [['lettuce', 12], ['cuke', 6], ['tomato', 6], ['coin', 6, '#e05a7a'], ['crouton', 10]] }],
  'greek-salad': ['bowl', '#dbe7ef', 'A bowl of Greek salad with tomato, cucumber, olives, onion and feta', { base: '#e8f0d8', bits: [['tomato', 10], ['cuke', 8], ['olive', 8], ['onionring', 5, '#b56aa0'], ['paneer', 5], ['herb', 10, G]] }],
  'simple-green-salad': ['bowl', '#e3e8d6', 'A bowl of mixed greens with shaved radish and vinaigrette', { base: '#8cc45a', bits: [['lettuce', 24], ['coin', 6, '#f3d6e0'], ['dot', 12, '#e9c060']], sides: [['sauce', 335, 235]] }],
  'cobb-salad': ['sectors', '#dfe8ef', 'A cobb salad with rows of chicken, bacon, egg, avocado, tomato and blue cheese', { base: '#9fd46e', sectors: [['chicken', 8], ['crumb', 12, '#a8452a'], ['egg', 2], ['chunk', 6, '#9ccf6a'], ['tomato', 5], ['crumb', 10, '#eef0f4']], bits: [] }],
  'chicken-caesar-salad': ['bowl', '#e8e1d2', 'A bowl of romaine with sliced chicken, croutons and shaved Parmesan', { base: '#9fd46e', bits: [['lettuce', 18], ['chicken', 10], ['crouton', 10], ['cheese', 12, '#fbf1d4']], sides: [['lemon', 335, 235]] }],
  'cold-soba-noodle-salad': ['bowl', '#dde8e0', 'A bowl of soba noodles with edamame, cucumber, carrot and sesame', { base: '#a58a6a', bits: [['noodle', 30, '#8a6a4a'], ['pea', 14, '#7bbf4a'], ['stick', 10, '#f08a33'], ['stick', 10, '#9ccf6a'], ['sesame', 24]], sides: [['chopsticks', 330, 150]] }],
  'smashed-cucumber-salad': ['bowl', '#e2ecd5', 'A bowl of smashed cucumbers in a glossy garlic chili dressing', { base: '#3a5a2e', bits: [['chunk', 18, '#bfdc8a'], ['dot', 12, '#c0392b'], ['sesame', 20], ['garlic', 4]] }],
  'creamy-coleslaw': ['bowl', '#f0e6cc', 'A bowl of creamy coleslaw with shredded cabbage and carrot', { base: '#f3f0dc', bits: [['cabbage', 60], ['stick', 16, '#f08a33'], ['cabbage', 10]] }],
  'classic-potato-salad': ['bowl', '#f6e7c8', 'A bowl of creamy potato salad with celery, egg and chives', { base: '#f3e2a8', bits: [['potato', 12], ['dice', 10, '#b6d98a'], ['ring', 10, '#5aa54a'], ['dot', 10, '#d0542a']] }],
  'italian-pasta-salad': ['bowl', '#f1e0cf', 'A bowl of pasta salad with salami, tomatoes, olives and mozzarella', { base: '#f3e6c0', bits: [['pasta', 22, '#f0c060'], ['tomato', 8], ['olive', 8], ['coin', 6, '#b8322a'], ['paneer', 5], ['herb', 10, G]] }],
  'roasted-vegetable-couscous': ['bowl', '#f2e4c9', 'A bowl of couscous with roasted zucchini, peppers, onion and chickpeas', { base: '#e9d09a', bits: [['seed', 80, '#f3e0b0'], ['zucchini', 6], ['pepper', 8, '#d8392b'], ['chickpea', 10], ['herb', 10, G]] }],
  bibimbap: ['sectors', '#f2d9cc', 'A rice bowl with vegetables arranged in sections around a fried egg', { base: '#fbf7ee', sectors: [['stick', 12, '#f08a33'], ['spinach', 5], ['stick', 12, '#f6efdc'], ['mushroom', 5], ['cuke', 5], ['blob', 6, '#c8321f']], center: 'egg', sides: [['chopsticks', 330, 150]] }],

  // ---- Pasta ----
  'basil-pesto-pasta': ['pasta', '#e2ecd5', 'A plate of pasta tossed in green pesto with basil and Parmesan', { short: 'pasta', pastaColor: '#8cb04a', bits: [['bigleaf', 5, '#3f8f3a'], ['cheese', 12, '#fbf1d4'], ['nut', 8, '#f3e2b0']] }],
  'baked-ziti': ['dish', '#f1e0cf', 'A baking dish of baked ziti with melted cheese on top', { base: '#c8412f', bits: [['pasta', 22, '#e9a444']], melt: 18, top: [['herb', 10, G]] }],
  'brown-butter-gnocchi': ['skillet', '#f2e4c9', 'Golden gnocchi in brown butter with crisp sage leaves', { base: '#b8742e', bits: [['gnocchi', 26], ['bigleaf', 8, '#4a7a3a'], ['cheese', 10, '#fbf1d4']] }],
  'cacio-e-pepe': ['pasta', '#e5e0ee', 'A plate of spaghetti with pecorino and cracked black pepper', { pastaColor: '#f3e2a0', pastaColor2: '#f8ecbc', bits: [['dot', 40, '#2a2a2a'], ['cheese', 14, '#fffaf0']], sides: [['fork', 340, 150]] }],
  'classic-lasagna': ['dish', '#f2d9cc', 'A pan of lasagna with bubbling cheese and a slice cut out', { base: '#c8412f', melt: 26, top: [['herb', 10, G]] }],
  'fettuccine-alfredo': ['pasta', '#e8e1d2', 'A plate of fettuccine in a creamy Parmesan sauce', { pastaColor: '#f6e2a0', pastaColor2: '#fbf0cc', bits: [['herb', 16, G], ['dot', 14, '#2a2a2a']], sides: [['fork', 340, 150]] }],
  'pasta-primavera': ['pasta', '#e3e8d6', 'A plate of pasta with peas, asparagus, zucchini and tomatoes', { short: 'pasta', pastaColor: '#f0c060', bits: [['pea', 16], ['stick', 8, '#6fb04d'], ['zucchini', 5], ['tomato', 6], ['cheese', 10, '#fbf1d4']] }],
  'pasta-puttanesca': ['pasta', '#f2d9cc', 'A plate of spaghetti in tomato sauce with olives and capers', { sauceTop: '#c23f2c', sauceR: 50, bits: [['olive', 10], ['pea', 10, '#6a8a3a'], ['herb', 12, G]] }],
  'penne-alla-vodka': ['pasta', '#f3e6d3', 'A bowl of penne in a creamy pink tomato sauce', { bowl: true, sauce: '#e8866a', short: 'pasta', pastaColor: '#ee9a70', bits: [['herb', 14, G], ['cheese', 10, '#fbf1d4']] }],
  'shrimp-scampi': ['pasta', '#dbe7ef', 'A plate of linguine with garlicky shrimp, parsley and lemon', { pastaColor: '#f3d98c', bits: [['shrimp', 8], ['herb', 18, G], ['dot', 10, '#c0392b']], sides: [['lemon', 335, 235]] }],
  'spaghetti-and-meatballs': ['pasta', '#f2d9cc', 'A plate of spaghetti with meatballs in tomato sauce', { sauceTop: '#c23f2c', sauceR: 50, bits: [['ball', 5, '#7a3f22'], ['bigleaf', 3, '#3f8f3a'], ['cheese', 8, '#fbf1d4']] }],
  'spaghetti-bolognese': ['pasta', '#efdcc9', 'A plate of spaghetti topped with meaty bolognese sauce', { sauceTop: '#9a3b22', sauceR: 52, bits: [['crumb', 30, '#6b2a1a'], ['cheese', 10, '#fbf1d4'], ['herb', 8, G]] }],
  'spaghetti-carbonara': ['pasta', '#f6e7c8', 'A plate of spaghetti carbonara with crisp pork and black pepper', { pastaColor: '#f3cf6a', pastaColor2: '#f6dc8a', bits: [['chunk', 12, '#b8502f'], ['dot', 30, '#2a2a2a'], ['cheese', 10, '#fffaf0']], sides: [['fork', 340, 150]] }],
  'spinach-ricotta-stuffed-shells': ['dish', '#f2e4c9', 'A baking dish of stuffed pasta shells in tomato sauce with melted cheese', { base: '#c8412f', bits: [['shell', 12]], melt: 8, top: [['herb', 10, G]] }],
  'stovetop-mac-and-cheese': ['bowl', '#f6e7c8', 'A bowl of creamy macaroni and cheese', { base: '#eea62a', bits: [['pasta', 34, '#fbd66a']], sides: [['spoon', 330, 230]] }],
  'tuna-noodle-casserole': ['dish', '#dfe8ef', 'A casserole of noodles, tuna and peas under a crisp crumb topping', { base: '#f0d68a', bits: [['noodle', 20, '#fbeebf'], ['pea', 16]], top: [['crumb', 40, '#d09a4a']] }],
  'vegetable-lo-mein': ['bowl', '#f5e2c4', 'A bowl of lo mein noodles with cabbage, carrot, mushrooms and snow peas', { base: '#b8742e', bits: [['noodle', 30, '#d9a45a'], ['stick', 10, '#f08a33'], ['greenbean', 6, '#6fb04d'], ['mushroom', 6], ['cabbage', 8]], sides: [['chopsticks', 330, 150]] }],
  'shrimp-pad-thai': ['plate', '#f4e3c0', 'A plate of pad thai with shrimp, peanuts, bean sprouts and lime', { bits: [['noodle', 34, '#e9b06a'], ['shrimp', 7], ['nut', 10, '#d9a45a'], ['stick', 10, '#f6efdc'], ['ring', 10]], sides: [['lime', 330, 80]] }],
  japchae: ['plate', '#e8e2f0', 'A plate of glass noodles with spinach, carrot, peppers and sesame', { bits: [['noodle', 40, '#a58a6a'], ['stick', 10, '#f08a33'], ['spinach', 6], ['pepper', 6, '#f2c230'], ['sesame', 24]], sides: [['chopsticks', 330, 150]] }],

  // ---- Chicken mains ----
  'baked-chicken-wings': ['sheetpan', '#f2d9cc', 'Crispy golden chicken wings on a sheet pan with celery and dip', { grid: ['drum', 4, 3, '#c9782e'], top: [['herb', 10, G]] }],
  'chicken-enchiladas': ['dish', '#f4e3c0', 'A baking dish of rolled enchiladas in red sauce with melted cheese and cilantro', { base: '#b8321f', rolls: 8, rollColor: '#e8cf96', melt: 10, top: [['leaf', 12, G], ['dice', 6, '#f2e9d8']] }],
  'chicken-fajitas': ['skillet', '#f4e3c0', 'A skillet of sizzling chicken strips with peppers and onions, with tortillas', { base: '#5a3a24', bits: [['pepper', 14, '#d8392b'], ['pepper', 10, '#f2c230'], ['pepper', 8, '#5e9c3a'], ['onionring', 6, '#f6ecd6'], ['chicken', 10]], sides: [['tortillas', 345, 235]] }],
  'chicken-marsala': ['plate', '#efe3d6', 'Chicken cutlets in a mushroom Marsala sauce with parsley', { mains: [['cutlet', -30, -20, -10], ['cutlet', 30, 30, 15]], bits: [['mushroom', 10], ['herb', 12, G]], sauce: '#8a4a2c' }],
  'chicken-parmesan': ['plate', '#f2d9cc', 'Breaded chicken cutlets topped with tomato sauce and melted cheese, with spaghetti', { pile: [['noodle', 16, '#f3d98c']], pileDx: -55, pileDy: 45, pileR: 45, mains: [['parm', 25, -15, -10, 1.35]], bits: [['herb', 8, G]] }],
  'chicken-piccata': ['plate', '#e3e8d6', 'Chicken cutlets in lemon butter sauce with capers and lemon slices', { mains: [['cutlet', -30, -20, -10], ['cutlet', 30, 30, 15]], bits: [['pea', 12, '#6a8a3a'], ['herb', 12, G]], sides: [['lemon', 335, 235]] }],
  'chicken-pot-pie': ['pie', '#f6e7c8', 'A golden chicken pot pie with a steam vent in the crust', { fill: '#e1a95a', top: [['crumb', 0]], cut: false, bits: [['seed', 20, '#c98a3e']] }],
  'chicken-salad-sandwiches': ['sandwich', '#e2ecd5', 'A chicken salad sandwich cut in half on a plate', { layers: [['#7cc05a', 12], ['#f1dfb0', 20]] }],
  'chicken-shawarma': ['sheetpan', '#f2e4c9', 'Spiced chicken strips and red onion on a sheet pan with pita and yogurt sauce', { bits: [['strip', 18], ['onionring', 10, '#b56aa0'], ['herb', 14, G]], sides: [['pita', 60, 240]] }],
  'chicken-tinga-tacos': ['tacos', '#f4e3c0', 'Three tacos with shredded chipotle chicken, onion and cilantro', { bits: [['stick', 12, '#c0582f'], ['dice', 6, '#f6ecd6'], ['leaf', 6, G]], sides: [['lime', 340, 105]] }],
  'chicken-vegetable-stir-fry': ['skillet', '#dde8e0', 'A wok of chicken with broccoli, peppers and snap peas in a glossy sauce', { base: '#8a4a2c', bits: [['chicken', 14], ['floret', 7], ['pepper', 8, '#d8392b'], ['greenbean', 6, '#6fb04d'], ['sesame', 20]], sides: [['rice', 340, 240]] }],
  'greek-chicken-souvlaki': ['skewers', '#dbe7ef', 'Chicken souvlaki skewers with lemon, tzatziki and pita', { pieces: ['chicken', 'pepper', 'chicken', 'onionring', 'chicken'], bits: [['herb', 10, G]], sides: [['cream', 340, 235], ['lemon', 60, 240]] }],
  'honey-garlic-chicken': ['plate', '#f6e7c8', 'Glazed chicken thighs with sesame seeds and green onion, beside rice', { mains: [['breast', -30, -10, -15, 0.8], ['breast', 30, 30, 20, 0.8]], bits: [['sesame', 20], ['ring', 12]], sauce: '#b8581e', sides: [['rice', 335, 230]] }],
  'jerk-chicken': ['sheetpan', '#e2ecd5', 'Dark spiced jerk chicken thighs on a sheet pan with lime wedges', { grid: ['drum', 4, 3, '#7a3418'], top: [['ring', 12], ['wedge', 3, LIME]] }],
  'juicy-baked-chicken-breasts': ['plate', '#e3e8d6', 'Golden baked chicken breasts sliced on a plate with herbs', { mains: [['breast', -20, -25, -10], ['breast', 20, 35, 15]], bits: [['herb', 16, G]], sides: [['greens', 335, 230]] }],
  'kung-pao-chicken': ['bowl', '#f2d9cc', 'A bowl of kung pao chicken with peanuts, dried chiles and green onion', { base: '#8a3a1c', bits: [['chicken', 14], ['nut', 12, '#e9c080'], ['pepper', 8, '#b8201a'], ['ring', 10]], sides: [['rice', 330, 225]] }],
  'orange-chicken': ['bowl', '#f6e7c8', 'A bowl of crispy chicken in a glossy orange sauce with sesame', { base: '#e0702e', bits: [['chicken', 18], ['sesame', 24], ['ring', 10]], sides: [['rice', 330, 225]] }],
  'simple-roast-chicken': ['chicken', '#f3dccb', 'A golden roast chicken on a platter with lemon and herbs', { bits: [['wedge', 6], ['bigleaf', 6, '#3c6e3a'], ['garlic', 5]] }],
  'teriyaki-chicken': ['plate', '#e8e1d2', 'Sliced teriyaki chicken with sesame seeds and green onion, beside rice', { mains: [['breast', 0, 0, -10]], bits: [['sesame', 20], ['ring', 12]], sauce: '#6b3a24', sides: [['rice', 335, 230]] }],

  // ---- Beef, pork and lamb mains ----
  'beef-bulgogi': ['plate', '#f2dfd0', 'Thin slices of marinated beef with sesame and green onion, beside rice', { bits: [['strip', 18], ['sesame', 20], ['ring', 12]], sides: [['rice', 335, 230]] }],
  'carne-asada': ['plate', '#f4e3c0', 'Sliced grilled steak with lime, salsa and cilantro', { mains: [['sliced', 0, 0, -10]], bits: [['leaf', 10, G]], sides: [['salsa', 335, 230], ['lime', 330, 75]] }],
  'classic-meatloaf': ['plate', '#efdcc9', 'Slices of glazed meatloaf with mashed potatoes', { mains: [['loaf', 10, -15, -8]], pile: [], sides: [['sauce', 335, 235]] }],
  'classic-pot-roast': ['plate', '#efe3d6', 'Pot roast with carrots and potatoes in gravy', { mains: [['roast', 0, -15, -5]], bits: [], pile: [['carrot', 8], ['potato', 6]], pileDx: 0, pileDy: 55, pileR: 38, sides: [['rosemary', 330, 60]] }],
  'cottage-pie': ['dish', '#e8e1d2', 'A baking dish of cottage pie with a golden mashed potato top', { base: '#f3dca0', bits: [['blob', 30, '#f8ecc4']], top: [['blob', 14, '#dca052'], ['herb', 8, G]] }],
  'lentil-shepherds-pie': ['dish', '#e3e8d6', 'A baking dish of lentil shepherd’s pie with a golden potato top', { base: '#f3dca0', bits: [['blob', 30, '#f8ecc4']], top: [['blob', 14, '#dca052'], ['herb', 10, G]] }],
  'lamb-kofta': ['skewers', '#f2e4c9', 'Lamb kofta on skewers with yogurt sauce, onion and herbs', { pieces: ['kofta'], bits: [['onionring', 6, '#b56aa0'], ['leaf', 10, G]], sides: [['cream', 340, 235]] }],
  'oven-pulled-pork': ['sub', '#efdcc9', 'A pulled pork sandwich with barbecue sauce and coleslaw', { bits: [['stick', 50, '#a8502a'], ['cabbage', 20]], sides: [] }],
  'pan-seared-pork-chops': ['plate', '#f2e4c9', 'Two golden seared pork chops with thyme and garlic', { mains: [['chop', -10, -30, -10], ['chop', 10, 35, 10]], bits: [['herb', 10, G], ['garlic', 3]] }],
  'pan-seared-steak': ['plate', '#e8e1d2', 'A seared steak sliced to show a pink center, with garlic butter and thyme', { mains: [['sliced', 0, 0, -10]], bits: [['garlic', 4], ['herb', 10, G]], sides: [['rosemary', 330, 60]] }],
  'pork-carnitas': ['tacos', '#f4e3c0', 'Carnitas tacos with crisp pork, onion, cilantro and lime', { bits: [['stick', 14, '#b8702e'], ['dice', 6, '#f6ecd6'], ['leaf', 6, G]], sides: [['lime', 340, 105]] }],
  'pork-tenderloin-with-apples': ['plate', '#f2e4c9', 'Sliced pork tenderloin with roasted apples and onions', { mains: [['sliced', 10, -10, 0]], pile: [['apple', 8], ['onionring', 4, '#f3e6c0']], pileDx: -50, pileDy: 45, bits: [['herb', 8, G]] }],
  'sausage-and-peppers': ['skillet', '#f1e0cf', 'A skillet of sausages with red and green peppers and onions', { base: '#6b3a24', bits: [['pepper', 12, '#d8392b'], ['pepper', 10, '#5e9c3a'], ['onionring', 6, '#f6ecd6']], top: [['sausage', 6]] }],
  'philly-cheesesteaks': ['sub', '#f2e4c9', 'A cheesesteak sandwich filled with sliced beef, onions and melted cheese', { bits: [['strip', 10], ['blob', 10, '#f6d35e'], ['onionring', 4, '#f3e6c0']] }],
  'classic-cheeseburgers': ['burger', '#f4e3c0', 'A cheeseburger with lettuce, tomato and melted cheese', { layers: [['#5a2e1a', 26], ['#f6c945', 8, true], ['#d9392b', 10], ['#7cc05a', 10, true]] }],
  'black-bean-burgers': ['burger', '#e2ecd5', 'A black bean burger with lettuce, tomato and avocado', { layers: [['#3a2a22', 26], ['#9ccf6a', 10], ['#d9392b', 10], ['#7cc05a', 10, true]] }],
  'stuffed-bell-peppers': ['sheetpan', '#f2d9cc', 'Bell peppers stuffed with rice and beef, topped with melted cheese', { bits: [], mains: [], top: [], sides: [] , peppers: true }],
  'stuffed-portobello-mushrooms': ['sheetpan', '#e8e1d2', 'Portobello caps filled with a golden, herby cheese stuffing', { bits: [], peppers: false, mains: [], sides: [], caps: true }],

  // ---- Fish and seafood ----
  'fish-and-chips': ['fishchips', '#dbe7ef', 'Battered fish and chips with lemon and tartar sauce', { sides: [['tartar', 60, 255], ['lemon', 350, 60]] }],
  'fish-tacos': ['tacos', '#dbe7ef', 'Three crispy fish tacos with cabbage slaw, crema and lime', { bits: [['chunk', 5, '#e3a94f'], ['cabbage', 10], ['dot', 8, '#fffaf0']], sides: [['lime', 340, 105]] }],
  'garlic-butter-shrimp': ['skillet', '#f6e7c8', 'A skillet of shrimp in garlic butter with parsley and lemon', { base: '#e9c86a', bits: [['shrimp', 16], ['garlic', 6]], top: [['herb', 18, G], ['wedge', 3]] }],
  'honey-soy-glazed-salmon': ['plate', '#dbe7ef', 'Glazed salmon fillets with sesame and green onion, beside rice', { mains: [['glazed', -20, -25, -8], ['glazed', 20, 40, 10]], bits: [['sesame', 16], ['ring', 10]], sides: [['rice', 335, 230]] }],
  'lemon-baked-cod': ['plate', '#dbe7ef', 'Baked cod fillets with lemon butter, lemon slices and parsley', { mains: [['whitefish', -20, -25, -8], ['whitefish', 20, 40, 10]], bits: [['herb', 16, G]], sides: [['lemon', 335, 235]] }],
  'salmon-cakes': ['balls', '#dbe7ef', 'Golden salmon cakes with a lemon wedge and sauce', { n: 5, size: 30, edge: '#b8702e', color: '#e3a55a', bits: [['herb', 3, G]], sides: [['tartar', 335, 235], ['lemon', 330, 70]] }],
  'shrimp-and-grits': ['bowl', '#f6e7c8', 'A bowl of creamy grits topped with shrimp, bacon and green onion', { base: '#f3dc8a', bits: [['shrimp', 8], ['crumb', 10, '#a8452a'], ['ring', 12]] }],
  'fresh-spring-rolls': ['rolls', '#e2ecd5', 'Fresh rice paper rolls with shrimp and herbs, with dipping sauce', { clear: true, wrap: '#f4efe6', bits: [['shrimp', 3], ['leaf', 6, G], ['stick', 4, '#f08a33']], sides: [['sauce', 335, 235]] }],

  // ---- Vegetarian mains ----
  'baked-falafel': ['balls', '#e2ecd5', 'Baked falafel with tahini sauce, pita and cucumber', { n: 7, size: 22, edge: '#8a6a2e', color: '#b89a4a', bits: [['herb', 4, G]], sides: [['sauce', 335, 235], ['cucumber', 60, 245]] }],
  'crispy-tofu-stir-fry': ['skillet', '#dde8e0', 'A wok of crispy tofu with broccoli, peppers and a glossy sauce', { base: '#8a4a2c', bits: [['tofu', 14], ['floret', 6], ['pepper', 8, '#d8392b'], ['sesame', 20]], sides: [['rice', 340, 240]] }],
  'eggplant-parmesan': ['dish', '#f2d9cc', 'A baking dish of eggplant Parmesan with tomato sauce, melted cheese and basil', { base: '#c8412f', bits: [['eggplant', 8]], melt: 16, top: [['bigleaf', 5, '#3f8f3a']] }],
  ratatouille: ['skillet', '#e8e2f0', 'A pan of ratatouille with zucchini, eggplant, tomato and pepper', { base: '#b8321f', bits: [['zucchini', 12], ['eggplant', 10], ['tomato', 8], ['pepper', 6, '#f2c230']], top: [['herb', 12, G]] }],
  'sweet-potato-black-bean-tacos': ['tacos', '#f2e4c9', 'Three tacos with roasted sweet potato, black beans and avocado', { bits: [['dice', 8, '#ee8a3a'], ['blackbean', 8], ['chunk', 3, '#9ccf6a'], ['leaf', 5, G]], sides: [['lime', 340, 105]] }],
  'tofu-banh-mi': ['sub', '#e8e1d2', 'A banh mi sandwich with crispy tofu, pickled carrot, cucumber and cilantro', { bits: [['tofu', 6], ['stick', 16, '#f08a33'], ['stick', 10, '#9ccf6a'], ['leaf', 10, G]] }],
  'tuscan-white-bean-skillet': ['skillet', '#e3e8d6', 'A skillet of white beans with tomatoes, spinach and garlic', { base: '#c46a36', bits: [['kidney', 26, '#f6efdc'], ['tomato', 8], ['spinach', 8], ['garlic', 4]] }],
  'vegetable-frittata': ['skillet', '#f6e7c8', 'A golden vegetable frittata in a skillet, cut into wedges', { base: '#f3cf5e', bits: [['dice', 12, '#d8392b'], ['spinach', 6], ['onionring', 4, '#f3e6c0'], ['dot', 12, '#e0a040']], top: [['herb', 8, G]] }],
  spanakopita: ['wedges', '#e2ecd5', 'Flaky phyllo triangles of spinach and feta pie', { n: 6, edge: '#c98a3e', color: '#eab765', layers: '#f3d69a' }],
  'margherita-pizza': ['pizza', '#f3e6d3', 'A margherita pizza with tomato, mozzarella and fresh basil', { bits: [['bigleaf', 8, '#3f8f3a']] }],

  // ---- Eggs and breakfast ----
  'avocado-toast-with-eggs': ['toasts', '#e2ecd5', 'Toast topped with smashed avocado and jammy halved eggs', { n: 2, w: 110, h: 130, top: '#9ccf6a', bits: [['egg', 2], ['dot', 10, '#c0392b']] }],
  'baked-oatmeal': ['dish', '#e8e2f0', 'A baking dish of baked oatmeal studded with blueberries', { base: '#d9b87a', bits: [['grain', 60, '#f1dfb6'], ['berry', 16]], top: [['nut', 8, '#b77b43']] }],
  'banana-bread': ['loaf', '#f6e7c8', 'A loaf of banana bread with slices cut', { crust: '#7a4520', top: '#9a5a2a', crumb: '#dcac6a', split: '#6b3a1c', sides: [['banana', 90, 60]] }],
  'berry-banana-smoothie': ['glass', '#e8e2f0', 'Two glasses of purple berry smoothie with berries and banana', { count: 2, layers: [['#8a4a8a', 160]], bits: [['berry', 4, '#3b4f9a']], straw: '#f3d24e', sides: [] }],
  'blueberry-muffins': ['muffins', '#dfe8ef', 'Three blueberry muffins with sugary tops', { bits: [['berry', 6, '#3b4f9a'], ['dot', 6, '#fffaf0']] }],
  'breakfast-burritos': ['burrito', '#f4e3c0', 'Breakfast burritos cut in half showing egg, potato and sausage', { fill: '#f3cf5e', bits: [['dice', 4, '#c98a3e'], ['herb', 3, G]], sides: [['salsa', 335, 235]] }],
  'breakfast-potato-hash': ['skillet', '#f6e7c8', 'A skillet of crispy potatoes with peppers and onions, topped with eggs', { base: '#b8742e', bits: [['potato', 16], ['dice', 10, '#d8392b'], ['dice', 8, '#5e9c3a']], eggs: [[-40, -30], [40, -20], [0, 45]], top: [['herb', 10, G]] }],
  'buttermilk-biscuits': ['buns', '#f6e7c8', 'A pan of tall golden buttermilk biscuits', { pan: '#a9adb4', edge: '#c98a3e', color: '#f0cc80', shine: true }],
  'buttermilk-waffles': ['stack', '#f6e7c8', 'A stack of waffles with butter, berries and syrup', { shape: 'square', n: 3, gap: 26, grid: '#c98a3a', butter: true, syrup: '#9a4f15', bits: [['berry', 5, '#c2304a']] }],
  'cheese-omelet': ['plate', '#f6e7c8', 'A folded cheese omelet with chives on a plate', { mains: [['omelet', 0, 0, -8]], bits: [['herb', 10, G]], sides: [['bread', 335, 235]] }],
  chilaquiles: ['skillet', '#f2d9cc', 'A skillet of tortilla chips in red sauce with fried eggs, cheese and onion', { base: '#b8321f', bits: [['chip', 26, '#e8b34f']], eggs: [[-30, -20], [35, 25]], top: [['crumb', 10, '#fffaf0'], ['onionring', 4, '#e7c0d8'], ['leaf', 10, G]] }],
  'cinnamon-rolls': ['buns', '#f2e4c9', 'A pan of cinnamon rolls with swirls and white glaze', { pan: '#b8742e', edge: '#b8702e', color: '#e6b060', spiral: '#8a4a20', glaze: '#fffaf0' }],
  'classic-crepes': ['folded', '#e8e2f0', 'Folded crepes with berries and powdered sugar', { bits: [['berry', 8, '#c2304a'], ['berry', 6, '#3b4f9a'], ['dot', 20, '#fffaf0']] }],
  'cranberry-orange-scones': ['wedges', '#f2e4c9', 'Cranberry orange scones cut in wedges with a white glaze', { n: 6, edge: '#c98a3e', color: '#f0cc80', bits: [['berry', 14, '#b8202a'], ['dot', 20, '#fffaf0']] }],
  'dutch-baby': ['skillet', '#f6e7c8', 'A puffed golden Dutch baby pancake with lemon and powdered sugar', { base: '#f3cf6a', rim: '#d99a3a', bits: [['blob', 10, '#e9b14a'], ['berry', 8, '#c2304a']], top: [['wedge', 2], ['dot', 40, '#fffaf0']] }],
  'french-toast': ['stack', '#f2e4c9', 'Slices of golden French toast with berries and syrup', { shape: 'square', n: 3, gap: 24, edge: '#b8702e', color: '#e3a94f', syrup: '#9a4f15', dust: true, bits: [['berry', 5, '#c2304a'], ['berry', 4, '#3b4f9a']] }],
  'huevos-rancheros': ['plate', '#f4e3c0', 'Fried eggs on tortillas with salsa, beans and avocado', { pile: [['blackbean', 18]], pileDx: 50, pileDy: 40, mains: [], bits: [['egg', 2], ['dice', 10, '#d8392b'], ['leaf', 8, G]], sides: [['tortillas', 60, 240]] }],
  'maple-nut-granola': ['bowl', '#f2e4c9', 'A bowl of clustered maple granola with nuts', { base: '#d9b87a', bits: [['crumb', 40, '#c98a3e'], ['grain', 40, '#f1dfb6'], ['nut', 14, '#b77b43'], ['nut', 8, '#f3e2b0']], sides: [['berries', 335, 235]] }],
  'sausage-egg-breakfast-sandwiches': ['burger', '#f6e7c8', 'An English muffin sandwich with sausage, egg and cheese', { bun: '#e6c080', seeds: 0, layers: [['#8a4a2c', 20], ['#f6c945', 8, true], ['#fffdf6', 12]], sides: [] }],
  'soft-scrambled-eggs': ['plate', '#f6e7c8', 'Soft scrambled eggs with chives and toast', { bits: [['blob', 40, '#f6d36a'], ['herb', 12, G]], sides: [['bread', 335, 235]] }],
  'spinach-feta-egg-bites': ['buns', '#e2ecd5', 'A muffin tin of egg bites with spinach and feta', { pan: '#a9adb4', edge: '#e0b04a', color: '#f3d36a', bits: [['herb', 4, '#2f7a34'], ['dot', 3, '#fffaf0']] }],
  'tofu-scramble': ['skillet', '#e2ecd5', 'A skillet of golden tofu scramble with peppers and spinach', { base: '#e9c04a', bits: [['blob', 30, '#f3d66a'], ['dice', 10, '#d8392b'], ['spinach', 6]], top: [['herb', 8, G]] }],
  'turkish-eggs': ['bowl', '#f2dfd0', 'Poached eggs on garlicky yogurt with red chile butter', { base: '#f6f0de', swirl: '#d9582f', bits: [['dot', 20, '#b8321f'], ['herb', 8, G]], sides: [['egg', 170, 130], ['bread', 335, 235]] }],
  'classic-deviled-eggs': ['deviled', '#f6e7c8', 'Deviled eggs dusted with paprika and chives on a plate', {}],

  // ---- Sides ----
  'baked-sweet-potato-fries': ['sheetpan', '#f2e4c9', 'Orange sweet potato fries on a sheet pan with a dipping sauce', { grid: ['fry', 3, 7] }],
  'creamy-mashed-potatoes': ['plate', '#f6e7c8', 'A mound of creamy mashed potatoes with butter and chives', { mains: [['mash', 0, 0]], bits: [['ring', 10], ['dot', 8, '#6b5a3a']] }],
  'garlic-bread': ['toasts', '#f2e4c9', 'Slices of golden garlic bread with parsley', { n: 4, h: 120, round: 10, top: '#f0cc6a', bits: [['herb', 8, G], ['blob', 3, '#e0a040']] }],
  'garlicky-sauteed-spinach': ['skillet', '#e2ecd5', 'A skillet of wilted spinach with sliced garlic and lemon', { base: '#2f5a2a', bits: [['spinach', 30], ['garlic', 8]], top: [['wedge', 2]] }],
  'honey-roasted-carrots': ['sheetpan', '#f2e4c9', 'Whole roasted carrots glazed with honey and thyme', { grid: ['wholecarrot', 1, 6], top: [['herb', 16, G]] }],
  'mexican-street-corn': ['corn', '#f4e3c0', 'Grilled corn on the cob with crema, cotija, chili and lime', { bits: [['dot', 20, '#fffaf0'], ['dot', 14, '#c0392b'], ['herb', 6, G]], sides: [['lime', 340, 250]] }],
  'roasted-broccoli': ['sheetpan', '#e3e8d6', 'Crispy roasted broccoli florets on a sheet pan with lemon', { grid: ['bigfloret', 6, 3], top: [['wedge', 2]] }],
  'roasted-brussels-sprouts': ['sheetpan', '#e3e8d6', 'Halved roasted Brussels sprouts on a sheet pan', { grid: ['bigsprout', 7, 4], top: [['dot', 20, '#6b4a1f']] }],
  'roasted-cauliflower': ['sheetpan', '#f5e2c4', 'Spiced golden roasted cauliflower on a sheet pan', { grid: ['bigcauli', 6, 3], top: [['dot', 30, '#c96a2a'], ['herb', 8, G]] }],
  'roasted-sweet-potatoes': ['sheetpan', '#f2e4c9', 'Roasted sweet potato chunks on a sheet pan', { grid: ['bigsweet', 6, 3], top: [['herb', 8, G]] }],
  'skillet-cornbread': ['skillet', '#f6e7c8', 'Golden cornbread in a cast-iron skillet with butter', { base: '#e9b53a', bits: [['dot', 40, '#d8a030']], top: [['chunk', 1, '#fbe6a2']] }],
  'soft-dinner-rolls': ['buns', '#f6e7c8', 'A pan of soft, shiny dinner rolls', { pan: '#a9adb4', edge: '#b8702e', color: '#e6a852', shine: true }],

  // ---- Desserts ----
  'butter-shortbread': ['bars', '#f6e7c8', 'Pale golden shortbread cut into fingers', { rows: 2, cols: 6, edge: '#e6c080', color: '#f6dea0', bits: [['dot', 3, '#d0a860']] }],
  'caramel-flan': ['dome', '#f6e7c8', 'A caramel flan turned out onto a plate in a pool of caramel', {}],
  'carrot-cake': ['cake', '#f2e4c9', 'A carrot cake with cream cheese frosting and walnuts', { side: '#a8622e', top: '#fbf3e0', inside: '#c98a3e', layer: '#fbf6ea', bits: [['nut', 10, '#b77b43'], ['stick', 6, '#f08a33']] }],
  'chocolate-mousse': ['glass', '#e6dcef', 'Three small glasses of chocolate mousse with whipped cream', { count: 3, short: true, layers: [['#5a3021', 90], ['#fffaf0', 18]], bits: [['dot', 4, '#5a3021']] }],
  'classic-apple-pie': ['pie', '#f2e4c9', 'A lattice-topped apple pie with a slice cut', { fill: '#e9c070', lattice: true, bits: [['apple', 10]] }],
  'crispy-rice-treats': ['bars', '#f6e7c8', 'Squares of crispy rice cereal treats', { rows: 3, cols: 4, edge: '#e6c890', color: '#f3dfb0', bits: [['grain', 14, '#fbf1d4']] }],
  'easy-tiramisu': ['layered', '#efe3d6', 'A dish of tiramisu dusted with cocoa and a slice showing its layers', { layers: [['#a86a3a', 16], ['#f6ecd6', 18], ['#a86a3a', 16], ['#f6ecd6', 18], ['#5a3021', 4]] }],
  'lemon-bars': ['bars', '#f6e7c8', 'Lemon bars dusted with powdered sugar', { rows: 3, cols: 4, edge: '#e6c080', color: '#f6d64a', top: [['dot', 60, '#fffaf0']] }],
  'mango-sticky-rice': ['plate', '#f4e3c0', 'Sticky rice with sliced ripe mango and coconut sauce', { mains: [['mound', -40, 0]], bits: [], sides: [], pile: [['peach', 10]], pileDx: 50, pileDy: 0, pileR: 40 }],
  'new-york-cheesecake': ['cake', '#f2e4c9', 'A tall New York cheesecake with a slice cut', { side: '#d9b06a', top: '#fbeecb', inside: '#fbf1d4', crumb: '#c98a3e', bits: [], sides: [['berries', 330, 70]] }],
  'oatmeal-raisin-cookies': ['cookies', '#f2e4c9', 'Oatmeal raisin cookies on a plate', { edge: '#b87a3c', color: '#d6a060', bits: [['raisin', 6], ['grain', 5, '#f1dfb6']] }],
  'one-bowl-chocolate-cake': ['cake', '#e6dcef', 'A chocolate layer cake with a slice cut showing the layers', { side: '#3d2418', top: '#5a3021', inside: '#4a2a1a', layer: '#8a5a3a', rim: '#3d2418' }],
  'peach-cobbler': ['dish', '#f2e4c9', 'A baking dish of peach cobbler with golden biscuit topping', { base: '#e98a3a', bits: [['peach', 16]], top: [['blob', 22, '#e9b866'], ['dot', 20, '#fffaf0']] }],
  'peanut-butter-cookies': ['cookies', '#f2dfd0', 'Peanut butter cookies with crisscross fork marks', { edge: '#c08a4a', color: '#dcaa6a', fork: true, bits: [['dot', 3, '#fffaf0']] }],
  'pumpkin-pie': ['pie', '#f2e4c9', 'A pumpkin pie with whipped cream and a slice cut', { fill: '#d8732a', top: [['swirl', 1, '#fffaf0']] }],
  snickerdoodles: ['cookies', '#f2e4c9', 'Cinnamon sugar snickerdoodle cookies with crackled tops', { edge: '#d6a870', color: '#efd09a', crack: '#c9975a', bits: [['dot', 10, '#a8703a']] }],
  'strawberry-shortcake': ['shortcake', '#f2d9cc', 'A split biscuit filled with strawberries and whipped cream', { sides: [['berries', 340, 70]] }],
  'vanilla-cupcakes': ['muffins', '#e8e2f0', 'Three vanilla cupcakes with swirled frosting and sprinkles', { liner: '#f3d3e0', frosting: '#fbf3e6', bits: [['dot', 6, '#e05a7a'], ['dot', 5, '#5aa0d8']] }],
  'vanilla-panna-cotta': ['dome', '#e8e2f0', 'A vanilla panna cotta with a mixed berry sauce', { color: '#fbf6ea', cap: '#fffaf0', pool: '#b8203a', bits: [['berry', 8, '#3b4f9a'], ['berry', 6, '#c2304a']] }],
  'vanilla-pudding': ['glass', '#f6e7c8', 'Three glasses of vanilla pudding with whipped cream', { count: 3, short: true, layers: [['#f6dc8a', 90], ['#fffaf0', 16]], bits: [['dot', 4, '#9a5a2a']] }],

  // ---- Snacks and dips ----
  'baba-ganoush': ['dip', '#efe3d6', 'Smoky baba ganoush with olive oil and parsley, with pita', { base: '#c9b08a', swirl: '#b8906a', oil: '#c9a23a', bits: [['herb', 10, G], ['dot', 8, '#c0392b']], dippers: [['chip', 16, '#e8c27e']] }],
  'buffalo-cauliflower-bites': ['sheetpan', '#f2d9cc', 'Cauliflower bites tossed in orange buffalo sauce with celery', { grid: ['bigcauli', 6, 3], top: [['blob', 30, '#e0602a']] }],
  'chunky-guacamole': ['dip', '#e2ecd5', 'A bowl of chunky guacamole with onion and cilantro, surrounded by chips', { base: '#8cbf4a', bits: [['chunk', 10, '#b6d98a'], ['dice', 8, '#f3e6ef'], ['leaf', 8, G]], dippers: [['chip', 22]] }],
  'crispy-roasted-chickpeas': ['bowl', '#f2e4c9', 'A bowl of crunchy roasted chickpeas dusted with paprika', { base: '#c98a3e', bits: [['chickpea', 44], ['dot', 20, '#b8321f']] }],
  'cucumber-tzatziki': ['dip', '#dbe7ef', 'A bowl of tzatziki with cucumber and dill, with pita and vegetables', { base: '#f6f3ea', bits: [['stick', 10, '#9ccf6a'], ['herb', 12, G]], oil: '#e0c060', dippers: [['chip', 10, '#e8c27e'], ['cuke', 6]] }],
  'no-bake-energy-bites': ['balls', '#f2e4c9', 'Oat and peanut butter energy bites with chocolate chips', { n: 7, size: 22, edge: '#a8784a', color: '#c9a070', bits: [['chip2', 2], ['grain', 3, '#f1dfb6']] }],
  'pico-de-gallo': ['dip', '#f4e3c0', 'A bowl of pico de gallo with tomato, onion and cilantro, with chips', { base: '#e3553a', bits: [['dice', 26, '#e8402f'], ['dice', 10, '#f6ecd6'], ['leaf', 10, G], ['dice', 6, '#6fb04d']], dippers: [['chip', 20]] }],
  'silky-hummus': ['dip', '#f2e4c9', 'A swirl of hummus with olive oil and paprika, with pita wedges', { base: '#ead3a0', swirl: '#d9bd84', oil: '#c9a23a', bits: [['chickpea', 3], ['dot', 10, '#c0392b']], dippers: [['chip', 14, '#e8c27e']] }],
  'spinach-artichoke-dip': ['dish', '#e3e8d6', 'A baking dish of bubbling spinach artichoke dip with chips', { base: '#f0dca0', bits: [['spinach', 14], ['chunk', 8, '#c9cf9a']], melt: 12, top: [], sides: [] }],
  'stovetop-popcorn': ['popcorn', '#f2dfd0', 'A big bowl of fluffy popcorn', {}],
  'tomato-bruschetta': ['toasts', '#f1e0cf', 'Toasts topped with chopped tomato and basil', { n: 4, h: 100, top: '#e6b666', bits: [['dice', 10, '#d8392b'], ['herb', 3, '#3f8f3a']] }],

  // ---- Sandwiches and handhelds ----
  'beef-and-bean-burritos': ['burrito', '#f4e3c0', 'Beef and bean burritos cut in half, with salsa', { fill: '#7a3a24', bits: [['blackbean', 3], ['dice', 2, '#f3d27a']], sides: [['salsa', 335, 235]] }],
  'blt-sandwiches': ['sandwich', '#f2d9cc', 'A BLT sandwich with bacon, lettuce and tomato, cut in half', { layers: [['#7cc05a', 10], ['#d9392b', 12], ['#a8452a', 12]] }],
  'egg-salad-sandwiches': ['sandwich', '#f6e7c8', 'An egg salad sandwich cut in half', { layers: [['#7cc05a', 10], ['#f6e1a0', 22]] }],
  'grilled-cheese-sandwiches': ['sandwich', '#f6e7c8', 'A golden grilled cheese sandwich with melting cheese, beside tomato soup', { crust: '#b8702e', bread: '#e3a94f', layers: [['#f6c040', 16]], sides: [['hotsauce', 340, 235]] }],
  'tuna-salad-sandwiches': ['sandwich', '#dbe7ef', 'A tuna salad sandwich with lettuce, cut in half', { layers: [['#7cc05a', 10], ['#e8d6b0', 22]] }],
};

// Hand-drawn extras for the few dishes a template can't express.
export const EXTRA = {
  'huevos-rancheros'(rand, K, B) {
    let s = K.plate(rand, {});
    s += '<circle cx="185" cy="150" r="84" fill="#e8cf96"/><circle cx="188" cy="146" r="80" fill="#f1dcaa"/>';
    s += B(rand, [['blob', 22, '#c8412f']], 185, 150, 62) + B(rand, [['blackbean', 14]], 250, 205, 20);
    for (const [x, y] of [[150, 125], [215, 165]]) s += `<path d="M${x - 30} ${y}C${x - 30} ${y - 28} ${x + 6} ${y - 34} ${x + 30} ${y - 10}S${x + 18} ${y + 30} ${x - 3} ${y + 28} ${x - 30} ${y + 18} ${x - 30} ${y}Z" fill="#fffdf6"/><circle cx="${x}" cy="${y}" r="12" fill="#f5b12a"/>`;
    return s + B(rand, [['chunk', 5, '#9ccf6a'], ['leaf', 10, G], ['crumb', 6, '#fffaf0']], 185, 150, 70);
  },
  'stuffed-bell-peppers'(rand, K, B) {
    let s = K.sheetpan(rand, { bits: [] });
    for (const [x, y, c] of [[110, 110, '#d8392b'], [200, 105, '#f2c230'], [290, 110, '#5e9c3a'], [150, 195, '#e87a2a'], [250, 195, '#d8392b']]) {
      s += `<circle cx="${x}" cy="${y}" r="40" fill="${c}"/><circle cx="${x}" cy="${y}" r="31" fill="#8a3a22"/>${B(rand, [['blob', 6, '#f3d27a'], ['grain', 6, '#fffaf0'], ['herb', 3, G]], x, y, 24)}`;
    }
    return s;
  },
  'stuffed-portobello-mushrooms'(rand, K, B) {
    let s = K.sheetpan(rand, { bits: [] });
    for (const [x, y] of [[115, 110], [210, 105], [300, 115], [155, 195], [255, 195]]) {
      s += `<circle cx="${x}" cy="${y}" r="42" fill="#5a3a2a"/><circle cx="${x}" cy="${y}" r="34" fill="#8a6a4a"/>${B(rand, [['crumb', 14, '#d8a860'], ['spinach', 3], ['dot', 6, '#fffaf0'], ['herb', 4, G]], x, y, 26)}`;
    }
    return s;
  },
  'chicken-pot-pie'(rand, K, B) {
    let s = K.pie(rand, { fill: '#e1a95a', cut: false, bits: [] });
    s += `<circle cx="180" cy="150" r="96" fill="#e6b060"/>`;
    for (const r of [0, 60, 120, 180, 240, 300]) s += `<path d="M180 150l0-40" stroke="#b8702e" stroke-width="5" stroke-linecap="round" transform="rotate(${r} 180 150)"/>`;
    return s + `<circle cx="180" cy="150" r="10" fill="#b8702e"/>` + B(rand, [['dot', 30, '#f3d08a']], 180, 150, 85);
  },
  'classic-meatloaf'(rand, K, B) {
    return K.plate(rand, { mains: [['mash', -50, 40], ['loaf', 30, -25, -8]], bits: [['herb', 8, G]] });
  },
  'mango-sticky-rice'(rand, K, B) {
    let s = K.plate(rand, { mains: [['mound', -35, 0]] });
    s += B(rand, [['grain', 40, '#f6f0de']], 150, 150, 40);
    for (let i = 0; i < 6; i++) s += `<path d="M${215 + i * 9} ${95 + i * 4}q30 50 0 110" fill="none" stroke="${i % 2 ? '#f6b13a' : '#f9c24a'}" stroke-width="14" stroke-linecap="round"/>`;
    s += `<path d="M110 130c20-10 60-10 80 0" stroke="#fffaf0" stroke-width="7" fill="none" stroke-linecap="round"/>` + B(rand, [['sesame', 16]], 150, 140, 30);
    return s;
  },
  'soft-scrambled-eggs'(rand, K, B) {
    let s = K.plate(rand, { sides: [['bread', 335, 235]] });
    s += B(rand, [['blob', 50, '#f6d36a'], ['blob', 20, '#fbe08a']], 175, 150, 70) + B(rand, [['herb', 12, G], ['dot', 10, '#2a2a2a']], 175, 150, 70);
    return s;
  },
};
