import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core'; //hemos metido HostListener
import { WORDS } from './words';

// Lenght of the word.
const WORD_LENGTH = 6;

// Number of tries.
const NUM_TRIES = 6;



//Letter map.
const LETTERS = (() => {
  // letter -> true. Easier to check.
  const ret: { [key: string]: boolean } = {};
  for (let charCode = 97; charCode < 97 + 26; charCode++) {
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
  @ViewChildren('tryContainer') tryContainers!: QueryList<ElementRef>; //Esto no se puede usar por la version de angular.

  //Store all the tries.
  //One try is one row in the UI //PARA EL AHORCADO SUPONGO QUE ESTO NO SERA VISIBLE
  readonly tries: Try[] = [];

  //Para poder acceder a enum desde html (Las caracteristicas de cada letra)
  readonly LetterState = LetterState;


  // Letras del teclado
  readonly keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
  ]


  //Retorna el estado para una key del teclado a traves del index de las teclas.
  readonly curLetterStates: { [Key: string]: LetterState } = {};


  // Message shown in the message panel.
  infoMsg = '';

  //Controla info message fadding
  fadeOutInfoMessage = false;

  //Tracks the current letter index
  private curLetterIndex = 0;

  // Tracks the number of submitted tries.
  private numSubmittedTries = 0;

  //Guardamos la palabra secreta.
  private targetWord = '';

  // Booleano para ver si has ganado
  private won = false;

  private targetWordLetterCounts: { [letter: string]: number } = {};


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
    while (true) {
      // Escogemos una randomly y miramos que sea del mismo length que WORD_LENGTH.
      const index = Math.floor(Math.random() * numWords)
      const word = WORDS[index];

      if (word.length === WORD_LENGTH) {
        this.targetWord = word.toLowerCase();
        break;
      }
    }
    // Print target word.
    console.log('target word: ', this.targetWord);

    //Necesitamos una lista de palabras para comprobar.


    //stores the count for each letter from the target word.

    //Exaple: word is "happy", then this map will look like:
    //{ 'h':1, 'a':1, 'p': 2, 'y': 1}
    for (const letter of this.targetWord) {
      const count = this.targetWordLetterCounts[letter];
      if (count == null) {
        this.targetWordLetterCounts[letter] = 0;
      }
      this.targetWordLetterCounts[letter]++;
    }
    console.log(this.targetWordLetterCounts);


  }




  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.handleClickKey(event.key);
  }

  //Returns the classes for the given keyboard key based on its state.
  getKeyClass(key: string): string {
    const state = this.curLetterStates[key.toLowerCase()];
    switch (state) {
      case LetterState.FULL_MATCH:
        return 'match key';
      case LetterState.PARTIAL_MATCH:
        return 'partial key';
      case LetterState.WRONG:
        return 'wrong key';
      default:
        return 'key';
    }
  }




  handleClickKey(key: string) {
    // No proceses key down si el usuario ha ganado el juego.
    if (this.won) {
      return;
    }
    // if key is a letter, pintame la letra
    if (LETTERS[key.toLowerCase()]) {
      // Only allow typing letters in the current try. Don't go over if the current try has not been submitted
      if (this.curLetterIndex < (this.numSubmittedTries + 1) * WORD_LENGTH) { // _ _ _ _ _ (Si Estas en la primera posición) 1<tercer intento (2+1)*5
        this.setLetter(key);
        this.curLetterIndex++;
      }
    }
    //Handle Delete.
    else if (key == 'Backspace') {   //Si pulso tecla borrar borro siempre que el indice sea mayor que numero de intento * longitud letra.
      // Don't delete previous try.
      if (this.curLetterIndex > this.numSubmittedTries * WORD_LENGTH) {
        this.curLetterIndex--;
        this.setLetter('');
      }
    }
    // Enviamos respuesta
    else if (key = 'Enter') {
      this.checkCurrentTry();

    }


  }

  private setLetter(letter: string) {
    const tryIndex = Math.floor(this.curLetterIndex / WORD_LENGTH);
    const letterIndex = this.curLetterIndex - tryIndex * WORD_LENGTH;
    this.tries[tryIndex].letters[letterIndex].text = letter;
  }

  private checkCurrentTry() {
    // Comprobar si el usuario ha rellenado todos los huecos.
    const curTry = this.tries[this.numSubmittedTries];
    if (curTry.letters.some(letter => letter.text === '')) {
      this.showInfoMessage('Letras no introducidas!');
      return;
    }

    const wordFromCurTry = curTry.letters.map(letter => letter.text).join('').toUpperCase();
    if (!WORDS.includes(wordFromCurTry)) {
      this.showInfoMessage('Not in word list');
      // Shake the current row.

      /*
      const tryContainer =
          this.tryContainers.get(this.numSubmittedTries)?.nativeElement as
          HTMLElement;
      tryContainer.classList.add('shake');
      setTimeout(() => {
        tryContainer.classList.remove('shake');
      }, 500);
      */

      return;
    }

    //Clone the counts map. Need to use it every check with the initial values.
    const targetWordLetterCounts = { ...this.targetWordLetterCounts };
    const states: LetterState[] = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
      const expected = this.targetWord[i];
      const curLetter = curTry.letters[i];
      const got = curLetter.text.toLowerCase();
      let state = LetterState.WRONG;
      // Need to make sure only performs check when the letter has not been checked before.
      //
      //For example if the target word is "happy", then the first "a" user types should be checked, but the second "a" should not.
      if (expected === got && targetWordLetterCounts[got] > 0) {
        targetWordLetterCounts[expected]--;
        state = LetterState.FULL_MATCH;
      }
      else if (this.targetWord.includes(got) && targetWordLetterCounts[got] > 0) {
        targetWordLetterCounts[got]--;
        state = LetterState.PARTIAL_MATCH;
      }
      states.push(state);
    }
    console.log(states);

    // Animate.  

    //AQUI IRIA PARA CAMBIAR LAS LETRAS DE COLOR CUANDO LE DAS AL ENTER

    ///

    // Save to keyboard key states
    // Do this afterthe current try has been submitted and the animation is done (no animation)
    for (let i = 0; i < WORD_LENGTH; i++) {
      const curLetter = curTry.letters[i];
      const got = curLetter.text.toLocaleLowerCase();
      const curStoredState = this.curLetterStates[got];
      const targetState = states[i];
      // This allows override state with better result.
      // 
      //For example, if "A" was partial match in previous try, and becomes full match in the current try,
      // we update the state key state to the full match (because its enum value is larger).
      if (curStoredState == null || targetState > curStoredState) {
        this.curLetterStates[got] = targetState;
      }
    }


    this.numSubmittedTries++;

    if (states.every(state => state === LetterState.FULL_MATCH)) {
      this.showInfoMessage('NICE!');
      this.won = true;
      // bounce animation.

      return;
    }

    //running out of tries show correct answer.
    if (this.numSubmittedTries === NUM_TRIES) {
      this.showInfoMessage("La palabra era: " + this.targetWord.toUpperCase());
      // 
    }
  }

  private showInfoMessage(msg: string) {
    this.infoMsg = msg;
    //Que se muestre solo 2 segundos.
    setTimeout(() => {
      this.fadeOutInfoMessage = true;
      //Reset cuando la animación acaba.
      setTimeout(() => {
        this.infoMsg = '';
        this.fadeOutInfoMessage = false;
      }, 500);
    }, 2000);

  }


  ngOnInit() { //De momento no lo tiene
  }

}
