import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, ElementRef, HostListener, OnInit, ViewChildren } from '@angular/core'; //hemos metido HostListener
import { QueryList } from '@angular/core/src/render3';
import { WORDS } from './words';

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
  @ViewChildren('tryContainer') tryContainers!: QueryList<ElementRef>;

  //Store all the tries.
  //One try is one row in the UI //PARA EL AHORCADO SUPONGO QUE ESTO NO SERA VISIBLE
  readonly tries: Try[] = [];

  // Message shown in the message panel.
  infoMsg= '';

  //Controla info message fadding
  fadeOutInfoMessage = false;

  //Tracks the current letter index
  private curLetterIndex = 0;


  // Tracks the number of submitted tries.
  private numSubmittedTries= 0;

  //Guardamos la palabra secreta.
  private targetWord='';


  constructor() {

    // Populate initial state of "tries".
    for (let i = 0; i < NUM_TRIES; i++) {
      const letters: Letter[] = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        letters.push({ text: '', state: LetterState.PENDING });
      }
      this.tries.push({ letters });
    }

    //Obtenemos una palabra de la lista de palabras.
    const numWords = WORDS.length;
    while(true){
      // Escogemos una randomly y miramos que sea del mismo length que WORD_LENGTH.
      const index = Math.floor(Math.random() * numWords)
      const word = WORDS[index];

      if (word.length === WORD_LENGTH){
        this.targetWord = word.toLowerCase();
        break;
      }
    }
    // Print target word.
    console.log('target word: ', this.targetWord);


  }


  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.handleClickKey(event.key);
  }

  private handleClickKey(key: string){
    // if key is a letter, pintame la letra
    if (LETTERS[key.toLowerCase()]){
      // Only allow typing letters in the current try. Don't go over if the current try has not been submitted
      if (this.curLetterIndex < (this.numSubmittedTries+1) * WORD_LENGTH){ // _ _ _ _ _ (Si Estas en la primera posición) 1<tercer intento (2+1)*5
        this.setLetter(key);
        this.curLetterIndex++;
      }
    }
    //Handle Delete.
    else if (key== 'Backspace'){   //Si pulso tecla borrar borro siempre que el indice sea mayor que numero de intento * longitud letra.
      // Don't delete previous try.
      if (this.curLetterIndex > this.numSubmittedTries * WORD_LENGTH){
        this.curLetterIndex--;
        this.setLetter('');
      }
    } 
    // Enviamos respuesta
    else if (key = 'Enter'){
      this.checkCurrentTry();

    }


  }

  private setLetter(letter: string){
    const tryIndex = Math.floor(this.curLetterIndex / WORD_LENGTH);
    const letterIndex = this.curLetterIndex - tryIndex * WORD_LENGTH;
    this.tries[tryIndex].letters[letterIndex].text = letter;
  }

  private checkCurrentTry(){
    // Comprobar si el usuario ha rellenado todos los huecos.
    const curTry =  this.tries[this.numSubmittedTries];
    if (curTry.letters.some(letter=>letter.text === '')){
      this.showInfoMessage('Letras no introducidas!');
      return;
    }

    const wordFromCurTry = curTry.letters.map(letter => letter.text).join('').toUpperCase();
    if (!WORDS.includes(wordFromCurTry)) {
      this.showInfoMessage('Not in word list');
      // Shake the current row.
      const tryContainer =
          this.tryContainers.get(this.numSubmittedTries)?.nativeElement as
          HTMLElement;
      tryContainer.classList.add('shake');
      setTimeout(() => {
        tryContainer.classList.remove('shake');
      }, 500);
      return;
    }

    //Necesitamos una lista de palabras para comprobar.


  }

  private showInfoMessage(msg: string){
    this.infoMsg = msg;
    //Que se muestre solo 2 segundos.
    setTimeout(() => {
      this.fadeOutInfoMessage = true;
      //Reset cuando la animación acaba.
      setTimeout(() => {
        this.infoMsg= '';
        this.fadeOutInfoMessage = false;
      }, 500);
    }, 2000);

  }


  ngOnInit() { //De momento no lo tiene
  }

}
