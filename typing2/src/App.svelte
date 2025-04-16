<script lang="ts">
  let tokens: string[] = $state([]);

  let chars = $derived(tokenToChars(tokens));
  let gridItems = $derived(createGridItems(chars));
  let correct = $derived(chars.map(_ => false));
  let index = $state(0);

  let timeStart = $state(0);
  let currTime = $state(0);

  let cpm = $derived(calcCurrentTime());
  let accuracy = $derived(calcAccuracy());

  let missedTokens: Map<string, number> = $state(new Map());
  let topKMissedTokensDisplay: TokenCount[] = $state([]);
  let topKMissedTokens: TokenCount[] = []; // to prevent rerunning fetch

  $effect(() => {
    document.addEventListener('click', function() {
      document.getElementById('content-box')!.focus();
    });

    setInterval(() => {
      currTime = Date.now();
    }, 500);
    nextTest();
  });

  function isPrintableKey(event: KeyboardEvent): boolean {
    const key = event.key;
    return key == 'Enter' || key.length === 1 && !event.ctrlKey && !event.metaKey;
  }

  function keyPress(e: KeyboardEvent) {
    if (timeStart == 0) {
      timeStart = Date.now();
      currTime = timeStart;
    }

    if (index > 0 && e.key == 'Backspace') {
      index--;
    }
    else if (e.key != 'Tab' && isPrintableKey(e) && index < chars.length) {
      let isCorrect = e.key == 'Enter' && chars[index] == '\n' || e.key == chars[index];
      if (!isCorrect) {
        let token = getTokenFromCharIndex(index);
        let tokenCount: number | undefined = missedTokens.get(token);
        if (tokenCount == undefined) missedTokens.set(token, 1);
        else missedTokens.set(token, tokenCount + 1);

        topKMissedTokens = getTopKMissedTokens(5);
        topKMissedTokensDisplay = topKMissedTokens;
      } 
      correct[index] = isCorrect;
      index++;

      if (index == chars.length) document.getElementById('next')!.focus();
    }
  }

  function calcAccuracy(): number {
    let correctAmt = 0;
    for (let i = 0; i < index; i++) {
      if (correct[i]) correctAmt++; 
    }
    if (index == 0) return 100;
    return (100 * correctAmt / index);
  }

  function calcCurrentTime(): number {
    if (timeStart == 0 || currTime - timeStart == 0) return 0;
    return index * 1000 / (currTime - timeStart) * 60;
  }

  interface TokenCount {
    token: string;
    missed: number;
  }

  function getTopKMissedTokens(k: number): TokenCount[] {
    let items = [...missedTokens.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
    return items.map(x => ({ token: x[0], missed: x[1] }));
  }

  function getTokenFromCharIndex(charIndex: number): string {
    let tokenCharCount = 0;
    for (let token of tokens) {
      tokenCharCount += token.length;
      if (tokenCharCount > charIndex) return token;
    }
    return '';
  }

  function tokenToChars(tokens: string[]): string[] {
    let chars: string[] = [];
    for (let token of tokens) {
      for (let char of token) {
        chars.push(char);
      }
    }
    return chars;
  }

  async function nextTest() {
    timeStart = 0;
    tokens = [];
    
    try {
      let obj = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tokens: topKMissedTokens })
      };

      let response = await fetch('http://localhost:8000', obj);
      tokens = await response.json();
      index = 0;
    } catch(e) {
      alert('test could not be loaded')
    }

    document.getElementById('content-box')!.focus();
  }

  function repeatTest() {
    index = 0;
    document.getElementById('content-box')!.focus();
  }

  interface RowItem {
    char: string;
    idx: number;
  }

  function createGridItems(chars: string[]): RowItem[][] {
    let rows: RowItem[][] = [];
    let index = 0;
    let maxWidth = 0;
    while (true) {
      let row: RowItem[] = [];
      for (let i = 0; i < 128 && index < chars.length; i++) {
        if (chars[index] == '\n') {
          row.push({ idx: index, char: ' ' });
          index++;
          break;
        }
        row.push({ idx: index, char: chars[index] });
        index++;
      }
      if (row.length > maxWidth) maxWidth = row.length;
      rows.push(row);
      if (index == chars.length) break;
    }

    // pad the rows to the max width
    for (let i = 0; i < rows.length; i++) {
      while (rows[i].length < maxWidth) {
        rows[i].push({ idx: -1, char: ' ' });
      }
    }


    return rows;
  }

  function gridColTemplate(items: RowItem[][]): string {
    if (items.length == 0) return '';
    let ret = '';
    for (let i = 0; i < items[0].length; i++) {
      ret += 'auto ';
    }
    return ret;
  }

  function gridRowTemplate(items: RowItem[][]): string {
    let ret = '';
    for (let i = 0; i < items.length; i++) {
      ret += 'auto ';
    }
    return ret;
  }

  function calcCursorX(index: number, items: RowItem[][]): number {
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items[i].length; j++) {
        if (index == items[i][j].idx) return 18 + j * 9.5;
      }
    }
    return 0;
  }
  
  function calcCursorY(index: number, items: RowItem[][]): number {
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items[i].length; j++) {
        if (index == items[i][j].idx) return 20 + i * 26;
      }
    }
    return 0;
  }
</script>

<main> 
  <div id="grid">
    <!--><div>
      <p>Boosted Tokens</p>
        {#each topKMissedTokensDisplay as token}
          <p><span>{token.token}</span> <span>{token.missed}</span></p>
        {/each}
    </div><!-->
    <div>
      <div id="content-box" tabindex="0" role="none" onkeydown={keyPress}>
        <div id="cursor" style={
          `left: ${calcCursorX(index, gridItems)}px; top: ${calcCursorY(index, gridItems)}px;`
        }></div>
        <div id="main-content" style={
          `grid-template-columns: ${gridColTemplate(gridItems)};
          grid-template-rows: ${gridRowTemplate(gridItems)};`
        }>
          {#each gridItems as row}
            {#each row as char}
              <span class={ 'char ' + 
                (char.idx < index ? 'written' : 'remaining') +
                ' ' + (correct[char.idx] ? 'correct' : 'incorrect')
              }>{char.char}</span>
            {/each}
          {/each}
        </div>
      </div>
      <div id="controls">
        <button id="next" onclick={nextTest}>next</button>
        <button onclick={repeatTest}>repeat</button>
      </div>
    </div>

    <div class="stat-container">
      <div class="stat">CPM: {cpm.toFixed(2)}</div>
      <div class="stat accuracy">Acc: {accuracy.toFixed(2)}</div>
    </div>
  </div>
</main>

<style>
  #cursor {
    width: 1px;
    height: 16px;
    z-index: 2; 
    background-color: white;
    position: absolute;
  }

  p {
    margin: 0px;
  }

  .stat-container {
    width: 100px;
  }

  .stat {
    text-align: left;
    padding-left: 16px;
  }

  #grid {
    display: grid;
    grid-template-columns: auto 1fr auto; 
  }
  
  #controls {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    grid-column: 1 / 3;
  }
  
  main {
    margin: auto;
  }

  #content-box {
    position: relative;
    left: 0;
    right: 0;
    padding: 16px;
    border: 1px solid black;
    height: 40vh;
  } 

  #main-content {
    min-width: 60vw;
    justify-content: start;
    align-content: start; 
    display: grid;
    gap: 0;
    font-size: 16px;
    font-family: monospace;
  }

  .char {
    width: 9.5px; 
    height: 26px; 
  }

  .written {
    color: white;
  }

  .written.correct {
    color: green;
  }

  .written.incorrect {
    color: red;
  }

  .remaining {
    color: gray;
  }
</style>
