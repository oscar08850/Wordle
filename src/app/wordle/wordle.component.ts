import { Component, HostListener, OnInit } from '@angular/core'; //hemos metido HostListener

// Lenght of the word.
const WORD_LENGTH = 5;

// Number of tries.
const NUM_TRIES = 6;


//Letter map.
const LETTERS = (()=>{
  // letter -> true. Easier to check.
  const ret: {[key:string]:boolean} = {};
  for (let charCode = 97; charCode<97+26; charCode++){
    ret[String.fromCharCode(charCode)] = true;
  }
  return ret;
})();

// One try??
interface Try {
  letters: Letter[];
}

// One letter in a try.
interface Letter {
  text: string;
  state: LetterState;
}

enum LetterState {
  WRONG, //Letter and position are wrong //GRIS
  PARTIAL_MATCH, //letter is correct but position is wrong //AMARILLO
  FULL_MATCH, // letra correcta y posicion correcta // VERDE
  PENDING, //before the  current try is submited //antes de darle a enviar
}

@Component({
  selector: 'wordle',
  templateUrl: './wordle.component.html',
  styleUrls: ['./wordle.component.scss']
})
export class Wordle implements OnInit {

  //Store all the tries.
  //One try is one row in the UI //PARA EL AHORCADO SUPONGO QUE ESTO NO SERA VISIBLE
  readonly tries: Try[] = [];

  //Tracks the current letter index
  private curLetterIndex = 0;

  constructor() {

    // Populate initial state of "tries".
    for (let i = 0; i < NUM_TRIES; i++) {
      const letters: Letter[] = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        letters.push({ text: '', state: LetterState.PENDING });
      }
      this.tries.push({ letters });
    }
  }


  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.handleClickKey(event.key);
  }

  private handleClickKey(key: string){
    // if key is a letter, pintame la letra
    if (LETTERS[key.toLowerCase()]){
      this.setLetter(key);
      this.curLetterIndex++;

    }
  }

  private setLetter(letter: string){
    const tryIndex = Math.floor(this.curLetterIndex / WORD_LENGTH);
    const letterIndex = this.curLetterIndex - tryIndex * WORD_LENGTH;
    this.tries[tryIndex].letters[letterIndex].text = letter;
  }




  ngOnInit() { //De momento no lo tiene
  }

}
