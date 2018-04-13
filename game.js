'use strict';

/* Vector */
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Должен быть передан объект типа vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }
  
  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

/* Actor */
class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    
    if ( !(pos instanceof Vector && size instanceof Vector && speed instanceof Vector) ) {
      throw new Error('Должен быть передан объект типа vector');
    }   
    
    this.pos = pos;
    this.size = size;
    this.speed = speed;    
  }
  
  get type() {
    return 'actor';
  }  
  
  get left() {
    return this.pos.x;
  }
  
  get right() {
    return this.pos.x + this.size.x;
  }
  
  get top() {
    return this.pos.y;
  }
  
  get bottom() {
    return this.pos.y + this.size.y;
  }  
  
  act() {};
  
  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Аргумент должен быть определен и его тип должен быть actor');
    }    
    
    if (actor === this) {
      return false;  
    }
    
    return !(this.right <= actor.left || this.bottom <= actor.top || this.top >= actor.bottom || this.left >= actor.right);
    
  }  
}

/* Level */
class Level {
  constructor(map, actors = []) {
    this.grid = [].concat(map).filter(Boolean);
    this.actors = actors;
    this.player = this.actors.find(function(actor) {
      return actor.type === 'player';
    });
    
    if (this.grid.length === 0) {
      this.height = 0;
      this.width = 0;
    } else {
      this.height = this.grid.length;     
      this.width = Math.max(...this.grid.map(function(arr) {
          return arr.length;
      }));
    }
    
    this.status = null;
    this.finishDelay = 1; 
  }
  
  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }
  
  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Объект не определен или его тип не Actor');
    };
    return this.actors.find(function(item) {
      return item.isIntersect(actor);
    });
    
  }
  
  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Тип переданных положения и размера не Actor');
    }  
    
    const spot = new Actor(pos, size);  
    
    if (spot.bottom >= this.height) {
      return 'lava';
    } 
    
    if (spot.top < 0 || spot.left < 0 || spot.right >= this.width) {  
      return 'wall';
    }
    
    for (let y = Math.floor(spot.top); y < Math.ceil(spot.bottom); y++) {
      for (let x = Math.floor(spot.left); x < Math.ceil(spot.right); x++) {
        if (this.grid[y][x] !== undefined) {
          return this.grid[y][x];
        }
      }
    }    
    
  }
  
  removeActor(actor) {
    this.actors = this.actors.filter(function(item) {
      return !(item === actor);
    });
  }
  
  noMoreActors(actorType) {   
    return !this.actors.some(function(item) {
      return item.type === actorType;
    });
  }
  
  playerTouched(actorType, actor) {
    if (actorType === 'lava' || actorType === 'fireball') {
      this.status = 'lost';
    }
    
    if (actorType === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    } 
  }
}

/* LevelParser */
class LevelParser {
  constructor(vocab = {}) {
    this.vocab = vocab;
  }
  
  actorFromSymbol(symb) {
    if (symb === undefined) {
      return;
    } else {
      return this.vocab[symb];
    }
  }
  
  obstacleFromSymbol(symb) {
    switch(symb) {
        case 'x':
            return 'wall';
        case '!':
            return 'lava';
    }
  }
  
  createGrid(strings) {
    return strings.map(arraySymb => arraySymb.split('').map(splitedSymb => this.obstacleFromSymbol(splitedSymb)));
  }
  
  createActors(strings) {
    
    const constructArray = [];
    
      for (let x in strings) {
        
        for (let y in strings[x]) {
          
          let symbol = strings[x][y];
          let constructor = this.vocab[symbol];  
          
          if (typeof(constructor) !== 'function') {
            continue;
          } 
          
          let obj = new constructor(new Vector(parseInt(y), parseInt(x)));
          
          if (obj instanceof Actor) {
            constructArray.push(obj);
          }          
        }
        
      }
    
    return constructArray;
    
  }  
  
  parse(strings) {
    return new Level(this.createGrid(strings), this.createActors(strings));
  }
  
}

/* Fireball */
class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }
  
  get type() {
    return 'fireball';
  }   
  
  getNextPosition(time = 1) {
    return new Vector((this.pos.x + this.speed.x * time), (this.pos.y + this.speed.y * time));
  }
  
  handleObstacle() {
    this.speed.x = -this.speed.x;
    this.speed.y = -this.speed.y;
  }
  
  act(time, lvl) {
    let nextPos = this.getNextPosition(time);
    let isThereObstacle = lvl.obstacleAt(nextPos, this.size);
    
    if (isThereObstacle === undefined) {
      this.pos = new Vector(nextPos.x, nextPos.y);
    } else {
      this.handleObstacle();
    }
  }
}

/* Fireballs */
class HorizontalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(2, 0));
  }  
  
  get type() {
    return 'fireball';
  }
}

class VerticalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 2));
  }  
  
  get type() {
    return 'fireball';
  }  
}

class FireRain extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 3));
    this.startPos = pos;
  }  
  
  get type() {
    return 'fireball';
  }
  
  handleObstacle() {
    this.pos = this.startPos;
  }
}

/* Coin */
class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(new Vector(pos.x + 0.2, pos.y + 0.1), new Vector(0.6, 0.6));
    this.realPos = this.pos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * (Math.PI);
  }
  
  get type() {
    return 'coin';
  }
  
  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }
  
  getSpringVector() {
    return new Vector(0, (Math.sin(this.spring) * this.springDist));
  }
  
  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.realPos.plus(this.getSpringVector());
  }
  
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

/* Player */
class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(new Vector(pos.x, pos.y - 0.5), new Vector(0.8, 1.5), new Vector(0, 0));
  }
  
  get type() {
    return 'player';
  }  
  
}

loadLevels()
  .then(
    function(result) {
      const schemas = JSON.parse(result);
      const actorDict = {
        '@': Player,
        'v': FireRain,
        'o': Coin,
        '=': HorizontalFireball,
        '|': VerticalFireball
      }
      const parser = new LevelParser(actorDict);

      runGame(schemas, parser, DOMDisplay)
        .then(() => alert('Вы выиграли приз!'));    

    }
  ).catch(function(err) {
    throw new Error(err);
  });

