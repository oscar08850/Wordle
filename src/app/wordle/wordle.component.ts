import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core'; //hemos metido HostListener
import { WORDS } from './words';

// Lenght of the word.
const WORD_LENGTH = 5;

// Number of tries.
const NUM_TRIES = 4;



//Letter map.
const LETTERS = (() => {
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


  // Inicializo el mensaje que se muestra el usuario.
  infoMsg = '';

  //Controla info message fadding (que desaparezca el mensaje)
  fadeOutInfoMessage = false;

  //Indice de la letra actual
  private curLetterIndex = 0;

  // Por que intento vamos.
  private numSubmittedTries = 0;

  //Guardamos la palabra secreta.
  private targetWord = '';

  // Booleano para ver si has ganado
  private won = false;


  private targetWordLetterCounts: { [letter: string]: number } = {};


  constructor() {

    // Populate initial state of "tries". Inicializamos el tablero y ponemos los estados de las letras vacias en PENDIENTE
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

      //Si coincide el tama??o salimos del bucle infinito
      if (word.length === WORD_LENGTH) {
        this.targetWord = word.toLowerCase();
        break;
      }
    }

    // Ense??ame la palabra secreta 
    console.log('No hagas trampa! la target word es: ', this.targetWord);

    //Necesitamos una lista de palabras para comprobar.


    //stores the count for each letter from the target word.

    //Exaple: word is "happy", then this map will look like:
    //{ 'h':1, 'a':1, 'p': 2, 'y': 1}
    for (const letter of this.targetWord) {
      const count = this.targetWordLetterCounts[letter];
      console.log("const count = this.targetWordLetterCounts[letter];" + count);
      if (count == null) {
        this.targetWordLetterCounts[letter] = 0;
      }
      this.targetWordLetterCounts[letter]++;
    }
  }



  // evento teclado
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.handleClickKey(event.key);
  }

  //Retorna la clase para la tecla segun el estado de la letra. Esto lo usaremos para pintar las letras del teclado.
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
    // if key is a letter, pintame la letra (diferente de n??mero)
    if (LETTERS[key.toLowerCase()]) {
      // Solo permite escribir letras en el intento actual. No permite saltar al siguiente.
      if (this.curLetterIndex < (this.numSubmittedTries + 1) * WORD_LENGTH) { // _ _ _ _ _ (Si Estas en la primera posici??n) 1<tercer intento (2+1)*5
        this.setLetter(key);
        this.curLetterIndex++;
      }
    }
    //Handle Delete.
    else if (key == 'Backspace') {   //Si pulso tecla borrar borro siempre que el indice sea mayor que numero de intento * longitud letra.
      // No borres el intento anterior por que ya se ha enviado. No hagas trampas!!!
      if (this.curLetterIndex > this.numSubmittedTries * WORD_LENGTH) {
        this.curLetterIndex--;
        this.setLetter(''); //borra la letra (escribe la letra en blanco)
      }
    }
    // Enviamos respuesta al presionar la tecla Enter
    else if (key = 'Enter') {
      this.checkCurrentTry();
    }


  }

  //Pinta la letra en el recuadro que toca
  private setLetter(letter: string) {
    const tryIndex = Math.floor(this.curLetterIndex / WORD_LENGTH);
    const letterIndex = this.curLetterIndex - tryIndex * WORD_LENGTH;
    this.tries[tryIndex].letters[letterIndex].text = letter;
  }

  //Una vez le damos al intro: comprueba la palabra con el diccionario.
  private checkCurrentTry() {
    // Comprobar si el usuario ha rellenado todos los huecos.
    const curTry = this.tries[this.numSubmittedTries];
    if (curTry.letters.some(letter => letter.text === '')) {
      this.showInfoMessage('Faltan letras! Palabra incompleta');
      return;
    }
    const wordFromCurTry = curTry.letters.map(letter => letter.text).join('').toUpperCase(); //Lo junta y lo pone en mayusculas pq el diccionari est?? en mayusculas
    if (!WORDS.includes(wordFromCurTry)) { //Si no esta en el diccionario no comprueba si es correcta. Esto se podria llegar a quitar
      this.showInfoMessage('Not in word list');
      // Shake the current row. //Animacion que de error que no funciona.
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
      //Reset cuando la animaci??n acaba.
      setTimeout(() => {
        this.infoMsg = '';
        this.fadeOutInfoMessage = false;
      }, 500);
    }, 2000);

  }


  ngOnInit() { //De momento no lo tiene
  }

}
