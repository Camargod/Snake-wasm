import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import init, { Direction, Grid, InitOutput } from "src/assets/wasm/snake_game";
import {CELL_SIZE, GRID_HEIGHT, GRID_WIDTH} from './consts';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  wasmModule ?: InitOutput;

  @ViewChild('gameContent', {static: true}) gameContent !: ElementRef<HTMLCanvasElement>;
  gameContentContext !: CanvasRenderingContext2D;

  grid ?: Grid;
  snakeCells ?: Uint32Array;

  isPaused = false;

  keys : any = {
    "ArrowUp":Direction.UP,
    "ArrowDown": Direction.DOWN,
    "ArrowLeft": Direction.LEFT,
    "ArrowRight": Direction.RIGHT,
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key in this.keys) {
      this.grid?.set_direction(this.keys[event.key]);
    }
  }
  // async ngOnInit() {
  //   //import de memoria do JS para dentro do WASM
  //   this.memory = new WebAssembly.Memory({initial: 1});
  //   let buffer = await fetch('./assets/wasm/test.wasm');
  //   let response = await WebAssembly.instantiate(
  //     await buffer.arrayBuffer(), {
  //       js: {
  //         // refletimos o objeto de memoria do JS para dentro do WASM
  //         mem: this.memory,
  //       },
  //       console:  {
  //         log: () => console.log("Hey there, this is being called through a webassembly module!"),
  //         error: () => console.error("Bruh, this is an error! Also called from a webassembly module!"),
  //       }
  //     }
  //   );
  //   let exports = response.instance.exports as any;
  //   console.log(exports["sum"](1, 2));

  //   //aqui exportamos a memoria de dentro do WASM para o JS, porem podemos fazer isso de maneira mais simples manipulando a memoria que foi passada do JS para o WASM
  //   console.table(exports["mem"].buffer);
  //   //Aqui manipulamos a memoria que foi pega do JS dentro do WASM
  //   console.log(new TextDecoder().decode(new Uint8Array(this.memory.buffer,0,12)));
  //   //Aqui manipulamos a memoria que o WASM exportou para o JS
  //   console.log(new TextDecoder().decode(new Uint8Array(exports["mem"].buffer,0,12)));
  // }

  async ngOnInit(){
    this.wasmModule = await init();
    this.grid = Grid.new(GRID_WIDTH,GRID_HEIGHT,Math.ceil(GRID_WIDTH * GRID_HEIGHT * Math.random()),Math.ceil(Math.random() * GRID_WIDTH * GRID_HEIGHT));
    this.gameContentContext =  this.gameContent.nativeElement.getContext('2d')!;
    this.gameContentContext.canvas.width = this.grid.width * CELL_SIZE;
    this.gameContentContext.canvas.height = this.grid.height * CELL_SIZE;
    this.gameDraw();
    this.gameUpdate();
    console.log(this.grid.snake_cells());
    console.log(this.grid.snake_length());

  }


  drawGrid(){
    this.gameContentContext.fillStyle = 'black';
    this.gameContentContext.fillRect(0, 0, this.gameContentContext.canvas.width, this.gameContentContext.canvas.height);
    this.gameContentContext.beginPath();

    this.gameContentContext.strokeStyle = 'white';
    this.gameContentContext.fillStyle = 'white';
    this.gameContentContext.lineWidth= 2;

    for(let w = 0; w <= this.grid!.width; w++){
      this.gameContentContext.moveTo(w * CELL_SIZE, 0);
      this.gameContentContext.lineTo(w * CELL_SIZE, this.gameContentContext.canvas.width);
    }
    for(let h = 0; h <= this.grid!.height; h++){
      this.gameContentContext.moveTo(0, h * CELL_SIZE);
      this.gameContentContext.lineTo(this.gameContentContext.canvas.height,h * CELL_SIZE);
    }

    this.gameContentContext.stroke();
  }

  drawSnake(){
    const snakeHeadIndex = this.grid!.snake_head_index();
    const col = snakeHeadIndex % this.grid!.width;
    const row = Math.floor(snakeHeadIndex / this.grid!.width);
    this.gameContentContext.fillStyle = 'white';
    this.gameContentContext.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    new Uint32Array(this.wasmModule!.memory.buffer, this.grid!.snake_cells(), this.grid!.snake_length()).forEach((index) => {
      const col = index % this.grid!.width;
      const row = Math.floor(index / this.grid!.width);
      this.gameContentContext.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });
    this.gameContentContext.fillStyle = 'blue';
    let bonus_index = this.grid!.bonus_index;
    const bonusCol = bonus_index % this.grid!.width;
    const bonusRow = Math.floor(bonus_index / this.grid!.width);
    this.gameContentContext.fillRect(bonusCol * CELL_SIZE, bonusRow * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  }

  gameDraw(){
    if(this.isPaused) return;

    this.drawGrid();
    this.drawSnake();

    window.requestAnimationFrame(() => {this.gameDraw()});

  }


  gameUpdate(){
    setInterval(()=>{

      this.grid!.update();
    },300)
  }
}
