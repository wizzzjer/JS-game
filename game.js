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
    
    if ( !((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector)) ) {
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
    
    if ( (actor.left > this.left && actor.left < this.right) || (actor.right > this.left && actor.right < this.right) 
      || (actor.top > this.top && actor.top < this.bottom) || (actor.bottom > this.top && actor.bottom < this.bottom) ) {
      
      // частный случай условия выше: смежные границы
      if (actor.left === this.right || actor.right === this.left || actor.top === this.bottom || actor.bottom === this.top) {
        return false;
      }
      
      return true;    
      
    } else {
      return false;    
    }
  }  
}

/* Level */
class Level {
  constructor(map, actors = []) {
    this.grid = map;
    /*this.grid = [].concat(map).filter(Boolean);*/
    this.actors = actors;
    this.player = this.actors.find(function(actor) {
      return actor.type === 'player';
    });
    
    if (this.grid === undefined) {
      this.height = 0;
      this.width = 0;
    } else {
      this.height = map.length;
      this.width = Math.max(...this.grid.map(function(arr) {
          return arr.length;
      }));      
    }
    
    this.status = null;
    this.finishDelay = 1; 
  }
  
  isFinished() {
    if (this.status !== null && this.finishDelay < 0) {
      return true;
    } else {
      return false;    
    }
  }
  
  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Объект не определен или его тип не Actor');
    };
    console.dir(this);
    return this.actors.find(function(arrayActor) {
      return arrayActor.isIntersect(actor);
    });
    
  }
  
  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Тип переданных положения и размера не Actor');
    }  
    
    let spot = new Actor(pos, size);  
    
    if (spot.bottom >= this.height) {
      return 'lava';
    } 
    
    if (spot.top < 0 || spot.left < 0 || spot.right >= this.width) {  
      return 'wall';
    }
    
    for (let y = Math.floor(spot.top); y < Math.ceil(spot.bottom); y++) {
      for (let x = Math.floor(spot.left); x < Math.ceil(spot.right); x++) {
        if (typeof(this.grid[x][y] !== 'undefined')) {
          return (this.grid)[x][y];
        }
      }
    }    
    
  }
  
  removeActor(actor) {
    this.actors = this.actors.filter(function(arrayActor) {
      return !(arrayActor === actor);
    });
  }
  
  noMoreActors(actorType) {   
    return !this.actors.some(function(arrayActor) {
      return arrayActor.type === actorType;
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
    if (symb === 'x') {
      return 'wall'  ;
    } else if (symb === '!') {
      return 'lava';
    } else {
      return;
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
    
    if (isThereObstacle === undefined ) {
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

