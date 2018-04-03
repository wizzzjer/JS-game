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
    
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error('Должен быть передан объект типа vector');
    }   
    
    this.pos = pos;
    this.size = size;
    this.speed = speed;
    
    const leftConfig = {
      value: pos.x
    };
    Object.defineProperty(this, 'left', leftConfig);
    
    const rightConfig = {
      value: pos.x + size.x
    };
    Object.defineProperty(this, 'right', rightConfig);
    
    const topConfig = {
      value: pos.y
    };
    Object.defineProperty(this, 'top', topConfig);
    
    const bottomConfig = {
      value: pos.y + size.y
    };
    Object.defineProperty(this, 'bottom', bottomConfig);    
    
  }
  
  get type() {
    return 'actor';
  }  
  
  act() {};
  
  isIntersect(actor) {
    if (!(actor instanceof Actor) || actor === undefined) {
      throw new Error('Аргумент должен быть определен и его тип должен быть actor');
    }    
    
    if (actor === this) {
      return false;  
    }
    
    //не проходит тест на смежные границы, хотя вроде должен?
    if ( (actor.left > this.left && actor.left < this.right) || (actor.right > this.left && actor.right < this.right) || (actor.top > this.top && actor.top < this.bottom) || (actor.bottom > this.top && actor.bottom < this.bottom) ) {
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
    this.actors = actors;
    this.player = this.actors.find(function(actor) {
      return actor.type === 'player';
    });
    
    if (map === undefined) {
      this.height = 0;
      this.width = 0;
    } else {
      this.height = map.length;
      this.width = Math.max(...map.map(function(arr) {
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
    if (!(actor instanceof Actor) || actor === undefined) {
      throw new Error('Объект не определен или его тип не Actor');
    }
    
    console.log(this.actors);
    
    return this.actors.find(function(elem) {
      console.log(actor);
      console.log(elem.isIntersect(actor));
      return elem.isIntersect(actor);
    });
  }
  
  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw err;
    }  
    
    let spot = new Actor(pos, size);  
    if (spot.bottom > this.height) { //но почему???
      return 'lava';
    } else if (spot.top >= this.height || spot.left <= 0 || spot.right >= this.width) {  
      return 'wall';
    } else {
      return undefined;
    }
  }
  
  removeActor(actor) {
    this.actors = this.actors.filter(function(elem) {
      return !(elem === actor);
    });
  }
  
  noMoreActors(actorType) {   
    let isThere = this.actors.find(function(elem) {
      return elem.type === actorType;
    });
    
    if (isThere !== undefined) {
      return false;
    } else {
      return true;
    }
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





const grid = [
  [undefined, undefined],
  ['wall', 'wall']
];

function MyCoin(title) {
  this.type = 'coin';
  this.title = title;
}
MyCoin.prototype = Object.create(Actor);
MyCoin.constructor = MyCoin;

const goldCoin = new MyCoin('Золото');
const bronzeCoin = new MyCoin('Бронза');
const player = new Actor();
const fireball = new Actor();

const level = new Level(grid, [ goldCoin, bronzeCoin, player, fireball ]);

level.playerTouched('coin', goldCoin);
level.playerTouched('coin', bronzeCoin);

if (level.noMoreActors('coin')) {
  console.log('Все монеты собраны');
  console.log(`Статус игры: ${level.status}`);
}

const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
if (obstacle) {
  console.log(`На пути препятствие: ${obstacle}`);
}

const otherActor = level.actorAt(player);
if (otherActor === fireball) {
  console.log('Пользователь столкнулся с шаровой молнией');
}