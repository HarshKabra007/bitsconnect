const ADJECTIVES = [
  "Cosmic","Silent","Happy","Sneaky","Brave","Witty","Quiet","Fuzzy","Swift","Lucky",
  "Chill","Sleepy","Jolly","Bold","Gentle","Mighty","Curious","Zesty","Bright","Quirky",
  "Stellar","Sunny","Mellow","Groovy","Nimble","Sassy","Plucky","Snappy","Rowdy","Dizzy",
  "Clever","Funky","Breezy","Cheeky","Crafty","Dreamy","Epic","Frosty","Gritty","Humble",
  "Icy","Jazzy","Keen","Lofty","Moody","Nifty","Ornate","Peppy","Rustic","Spiffy",
];
const NOUNS = [
  "Panda","Wolf","Falcon","Tiger","Otter","Fox","Moose","Yak","Owl","Raven",
  "Dolphin","Lynx","Koala","Badger","Bison","Cobra","Gator","Hawk","Iguana","Jaguar",
  "Koi","Llama","Mantis","Narwhal","Ocelot","Puma","Quokka","Raccoon","Seal","Turtle",
  "Viper","Walrus","Xerus","Yeti","Zebra","Phoenix","Kraken","Dragon","Griffin","Hydra",
];

const activeAliases = new Set();

function generateAlias() {
  let tries = 0;
  while (tries++ < 50) {
    const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 100);
    const alias = `${a}${n}${num}`;
    if (!activeAliases.has(alias)) {
      activeAliases.add(alias);
      return alias;
    }
  }
  return `Stranger${Date.now().toString().slice(-5)}`;
}

function releaseAlias(alias) {
  activeAliases.delete(alias);
}

module.exports = { generateAlias, releaseAlias };
