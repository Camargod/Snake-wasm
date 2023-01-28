use wasm_bindgen::prelude::*;
use rand::Rng;
extern crate wee_alloc;

#[global_allocator]
static ALLOC : wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct Grid {
    pub width: usize,
    pub height: usize,
    snake: Snake,
    pub bonus_index: usize,
    last_index: usize
}

#[wasm_bindgen]
impl Grid {
    pub fn new(width : usize, height : usize, spawn_index : usize, bonus_index : usize) -> Grid {
        Grid { width: width, height: height, snake: Snake::new(spawn_index), bonus_index: 2, last_index: 0 }
    }
    pub fn set_height(&mut self,value : usize){
        self.height = value;
    }
    pub fn set_width(&mut self,value : usize){
        self.width = value;
    }
    pub fn snake_head_index(&self) -> usize{
        self.snake.body[0].0
    }
    // fn snake_body(&self) -> Vec<SnakeCell> {
    //     let (_, snake_body) = self.snake.body.split_at(1);
    //    snake_body.to_vec()
    // }
    pub fn update(&mut self){
        let temp = self.snake.body.clone();
        let next_cell =  self.gen_next_snake_cell();
        self.snake.body[0] = next_cell;
        self.snake_colide();
        self.last_index = self.snake.body[self.snake_length() - 1].0;

        for i in 1..self.snake_length() {
            self.snake.body[i] = SnakeCell(temp[i - 1].0);
        }
    }

    pub fn snake_length(&self) -> usize {
        self.snake.body.len()
    }

    pub fn snake_cells(&self) -> *const SnakeCell{
        self.snake.body.as_ptr()
    }

    fn gen_next_snake_cell(&mut self) -> SnakeCell {
        let head = self.snake_head_index();
        let (row,col) = self.index_to_cell(head);
        return match self.snake.direction {
            Direction::RIGHT => {
                // O operador % é caro em questão de performance.
                // SnakeCell((row * self.height) + (head + 1) % self.width)
                let treshold = (row + 1) * self.height;
                if head + 1 == treshold {
                    return SnakeCell(treshold - self.height);
                }
                SnakeCell(head + 1)
            },
            Direction::LEFT => {
                // SnakeCell((row * self.height) + (head - 1) % self.width)
                let treshold = row * self.height - 1;
                if head - 1 == treshold {
                    return SnakeCell(treshold + self.height);
                }
                SnakeCell(head - 1)
            },
            Direction::UP => {
                // SnakeCell((head - self.width) % (self.width * self.height))
                let treshold = col;
                if head == treshold {
                    return SnakeCell((self.width * (self.height - 1)) + col);
                }
                SnakeCell(head - self.height)
            },
            Direction::DOWN => {
                // SnakeCell((head + self.width) % (self.width * self.height))

                let treshold = (self.height - 1) * self.width + col;
                if head == treshold {
                    return SnakeCell(col);
                }
                SnakeCell(head + self.height)
            }
        }
    }


    fn snake_colide(&mut self){
        let snake_head = self.snake_head_index();
        let find_colision = |item : &SnakeCell| ->  bool{
            item.0 == snake_head
        };
        
        let (_,right) =  self.snake.body.split_at(1);

        let mut iter = right.to_vec().into_iter();

        if iter.find(find_colision).is_some(){
            alert("Colidiu");
            alert(now().to_string().as_str());
        }

        if self.snake.body.contains(&SnakeCell(self.bonus_index))  {
            self.snake.body.push(SnakeCell(self.last_index));
            self.set_new_bonus();
        }
    }

    fn set_new_bonus(&mut self){
        self.bonus_index = self.get_new_bonus();
    }

    fn get_new_bonus(&self) -> usize {
        rand::thread_rng().gen_range(0..=self.width*self.height)
    }

    fn index_to_cell(&self,index : usize) -> (usize,usize){
        (index / self.width, index % self.height)
    }   

    pub fn set_direction(&mut self,direction : Direction){
        self.snake.direction = direction;
    }
}

#[wasm_bindgen]
pub struct Snake {
    body : Vec<SnakeCell>,
    direction : Direction
}
#[wasm_bindgen]
#[derive(Clone,PartialEq)]
pub struct SnakeCell (usize);

impl Snake {
    fn new(spawn_index: usize) -> Snake{
        // let fake_body = vec![SnakeCell(26),SnakeCell(27),SnakeCell(28)];
        Snake { body: vec![SnakeCell(spawn_index)] , direction: Direction::LEFT }
        // Snake { body: fake_body , direction: Direction::LEFT }
    }
}
#[wasm_bindgen]
#[derive(PartialEq)]
pub enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT
}



// A anotação serve para marcar que será exportado dentro do modulo wasm
// #[wasm_bindgen]
// pub fn greet(name : String) -> String{
//     alert(&name);
//     name
// }

#[wasm_bindgen]
extern {
    pub fn alert(string: &str);
    fn now() -> usize;
}