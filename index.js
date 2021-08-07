// Elementos gráficos
const botaoAdicao = document.getElementById('butAdd'),
      botaoExec = document.getElementById("butExec"),
      lista = document.getElementById('listaInstrucoes'),
      addInstrucao = document.getElementById('opInstrucao'),
      addDest = document.getElementById('dest'),
      addSrc = document.getElementById('source'),
      addTempSpan = document.getElementById('tempSpan'),
      addTemp = document.getElementById('temp'),
      addImmediateSpan = document.getElementById('immSpan'),
      addImmediate = document.getElementById('imediato'),
      botRef = document.getElementById("pulaReferencias"),
      botVolta = document.getElementById("voltaReferencias"),
      referencias = document.getElementById("referencia"),
      regInt1 = document.getElementById('regs1'),
      regInt2 = document.getElementById('regs2'),
      regInt3 = document.getElementById('regs3'),
      regInt4 = document.getElementById('regs4'),
      ducky = document.getElementById('avatarDucky'),
      duckyPergunta = document.getElementById('textoPergunta'),
      duckyResposta = document.getElementById('textoDucky'),

      instrs = document.querySelectorAll('span[instr="1"]'),
      // Set com todas instruções que operam rx + immediate
      instrucoesImediato = new Set(["addi","subi","multi","divi"]),
      instrucoesImediatoIndices = new Set([1,3,9,11]),
      textos = [
          ["Que legal! O que estou vendo?", "Essa página ilustra o funcionamento de um processador da arquitetura MIPS, no tipo pipeline. Para isso, vamos visualizar essa implementação como etapas da confecção de um bolo."],
          ["Caramba, o que significa tudo isso?", "MIPS (Microprocessador sem Estágios de Pipeline Interconectados) é uma arquitetura aberta (livremente distribuída) para computadores. Isso significa que, seguindo as especificações do MIPS, é possível criar um computador!"],
          ["Interessante. E o que é aquilo de Pipeline?", "Além do MIPS ser um formato para criar um computador, ele também especifica como o criar na filosofia Pipeline. A ideia é que se fôssemos, por exemplo, apagar um incêndio, ao invés de ir e voltar para encher um balde de água e descarregá-lo no fogo nós teríamos uma fila de pessoas entre os dois que passa o balde adiante até ele chegar no seu destino. Para a arquitetura, isso significa que vamos quebrar uma única instrução, a unidade de operação de um processador, em diversos passos. Isso nos permite utilizar ao máximo todos os componentes do processador - eles sempre vão estar operando e passando adiante o seu resultado."],
          ["Nossa, isso parece perfeito!", "Realmente, o pipeline é uma forma incrível de melhorar a performance de um processador. Mas, de forma geral, as instruções - por não levarem em conta que o processador é pipelined - trazem algumas complicações que precisam ser lidadas durante a etapa de design. Uma dessas complicações é o conflito estrutural, que surge por diferentes instruções utilizarem os mesmos componentes. A solução pra isso é introduzir os registradores intermediários, e duplicar outros componentes, para isolar o contexto de cada instrução. Outra é a dependência de dados. Nela, precisamos de um dado que ainda não está disponível para a etapa atual, pois precisaria passar pela etapa de write-back. A solução disso é criar novas conexões para realizar o adiantamento (ou forwarding) de dados - caso seja necessário, elas vão adiantar a disponibilidade de um dado para a etapa atual."]
      ];

let valsInstrs = ['...', '...', '...', '...', '...'],
    imgCards = document.querySelectorAll('.imgCard'),
    counterPergunta = 0;

// Implementação de delay assíncrono
async function delay(val) {
    return new Promise(res => {
        setTimeout(() => {
            res(2);
        }, val);
    });
}

// Processador com seus registradores
class Processador {
    constructor(
        numRegistros
    ) {
        // Confere número de registros
        if (this.numRegistros <= 0)
            return false;
        // Inicializa informações
        this.numRegistros = numRegistros;
        this.instrucoes = [];
        this.registradores = [];
        this.pc = 0;
        for (let i = 0; i < this.numRegistros; ++i)
            this.registradores.push(0);

        // Inicializa registradores de pipeline internos
        this.npc = 0;
        this.npc2 = 0;
        this.ir = 0;
        this.a = 0;
        this.b = 0;
        this.b2 = 0;
        this.rt = 0;
        this.rd = 0;
        this.rd2 = 0;
        this.rd3 = 0;
        this.imm = 0;
        this.rs = 0;
        this.brTarget = 0;
        this.zero = 0;
        this.aluOut = 0;
        this.aluOut2 = 0;
        this.lmd = 0;
    }
    // Cria e adiciona nova intrução
    adicionaInstrucao() {
        let instrucaoNome = addInstrucao.options[addInstrucao.selectedIndex].value;
        let instrucao = new Instrucao(instrucaoNome);
        this.instrucoes.push(instrucao);
        return instrucao;
    }

    _atualizaInternos() {
        regInt1.innerHTML = `<b>NPC:</b> ${this.npc.toString(2)}<br/>`;
        regInt1.innerHTML += `<b>IR:</b> ${this.ir.toString(2)}<br/>`;

        regInt2.innerHTML = `<b>NPC:</b> ${this.npc2.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>Val<sub>A</sub>:</b> ${this.a.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>Val<sub>B</sub>:</b> ${this.b.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>RT:</b> ${this.rt.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>RD:</b> ${this.rd.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>Imediato:</b> ${this.imm.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>RS:</b> ${this.rs.toString(2)}<br/>`;

        regInt3.innerHTML = `<b>Branch Target:</b> ${this.brTarget.toString(2)}<br/>`;
        regInt3.innerHTML += `<b>Zero:</b> ${this.zero.toString(2)}<br/>`;
        regInt3.innerHTML += `<b>ALU Out:</b> ${this.aluOut.toString(2)}<br/>`;
        regInt3.innerHTML += `<b>B:</b> ${this.b2.toString(2)}<br/>`;
        regInt3.innerHTML += `<b>RD:</b> ${this.rd2.toString(2)}<br/>`;

        regInt4.innerHTML = `<b>LMD:</b> ${this.lmd.toString(2)}<br/>`;
        regInt4.innerHTML += `<b>ALU Out:</b> ${this.aluOut2.toString(2)}<br/>`;
        regInt4.innerHTML += `<b>RD:</b> ${this.rd3.toString(2)}<br/>`;
    }

    // Executa instruções salvas em sequência pelo número de etapas no pipeline
    async executar() {
        for (let i = 0; i < 6; i++) {
            let instrucaoNop = new Instrucao('nop');
            this.instrucoes.push(instrucaoNop);
        }

        this.pc = 0;
        for (let i = 0, k = 0;
             i < this.instrucoes.length;
             ++i, ++k) {
            for (let j = 0; j < 5; ++j) {
                let instrNum = i - 4 + j;
                if (instrNum < 0)
                    continue;
                this.instrucoes[instrNum].step();
            }
            
            valsInstrs.pop();
            if (this.instrucoes[i].instrucao == 'nop') {
                valsInstrs.unshift('...');
            } else {
                valsInstrs.unshift(i);
            }

            atualizaInstrs();

            this.pc += 4;
            atualizaTabela();
            this._atualizaInternos();
            await delay(500);
        }
    }
}

// Cria novo processador
var processador = new Processador(32);

// Classe de instrução com suas funções
class Instrucao {
    constructor(instrucaoNome) {
        // Inicializa valores
        this.etapa = 0;
        this.instrucao = instrucaoNome;
        if (this.instrucao == 'nop') {
            this.rDest = 0;
            this.rSource1 = 0;
            this.rSource2 = 0;
            this.immediate = 0;
            return;
        }
        this.rDest = parseInt(addDest.value);
        this.rSource1 = parseInt(addSrc.value);
        this.rSource2 = parseInt(addTemp.value);
        this.immediate = parseInt(addImmediate.value);
    }

    toString() {
        // if (this.instrucao == "addi" || this.instrucao == "subi")
        if (instrucoesImediato.has(this.instrucao))
            return `${this.instrucao} \$r${this.rDest} \$r${this.rSource1} #${this.immediate}`;
        else if (this.instrucao == 'nop')
            return `nop`;
        else
            return `${this.instrucao} \$r${this.rDest} \$r${this.rSource1} \$r${this.rSource2}`;
    }

    // Executa atualização de informações por etapa
    step() {
        // Confere execução de instrução
        if (this.etapa > 5)
            return;

        // Atualiza etapa
        this.etapa++;

        switch (this.etapa) {
            // Atualiza informações de processo
            case 1:
                processador.npc = processador.pc + 4;
                if (this.instrucao == 'nop')
                    processador.ir = `(nop)`;
                else
                    processador.ir = `(${this.instrucao})|${this.rSource1.toString(2)}|${this.rSource2.toString(2)}|${this.rDest.toString(2)}`;
                break;

            // Carrega informações de registro
            case 2:
                // if (this.rSource1 != 0)
                processador.a = processador.registradores[this.rSource1];
                // if (this.rSource2 != 0 && !instrucoesImediato.has(this.instrucao))
                processador.b = processador.registradores[this.rSource2];
                processador.rd = this.rDest;
                processador.rs = this.rSource1;
                processador.rt = this.rSource2;
                processador.npc2 = processador.npc;
                if (instrucoesImediato.has(this.instrucao))
                    processador.imm = this.immediate;
                break;

            // Realiza aritmética e cálculo de branching
            case 3:
                processador.brTarget = processador.npc + processador.imm;
                processador.zero = 0;
                if (this.instrucao == 'nop') {
                    processador.aluOut = 0;
                } else {
                    // Adiantamento (forwarding) no resultado da operação anterior (rd = registrador destino da EX/MEM)
                    if (processador.rd2 == processador.rs) { // rd da EX/MEM é o ra
                        processador.a = processador.aluOut;
                    } else if (processador.rd2 == processador.rt) { // rd da EX/MEM é o rb
                        processador.b = processador.aluOut;
                    }

                    switch (this.instrucao) {
                        case 'add':
                            processador.aluOut = processador.a + processador.b;
                            break;
                        case 'addi':
                            processador.aluOut = processador.a + processador.imm;
                            break;
                        case 'sub':
                            processador.aluOut = processador.a - processador.b;
                            break;
                        case 'subi':
                            processador.aluOut = processador.a - processador.imm;
                            break;
                        case 'and':
                            processador.aluOut = processador.a && processador.b;
                            break;
                        case 'or':
                            processador.aluOut = processador.a || processador.b;
                            break;
                        case 'xor':
                            processador.aluOut = processador.a ^ processador.b;
                            break;
                        case 'xor':
                            processador.aluOut = !processador.a && !processador.b;
                            break;
                        case 'mult':
                            processador.aluOut = processador.a * processador.b;
                            break;
                        case 'multi':
                            processador.aluOut = processador.a * processador.imm;
                            break;
                        case 'div':
                            processador.aluOut = processador.a / processador.b;
                            break;
                        case 'divi':
                            processador.aluOut = processador.a / processador.imm;
                            break;
                    }
                }
                processador.aluOut = parseInt(processador.aluOut);
                processador.rd2 = processador.rd; // ??????? MULT
                processador.b2 = processador.b;
                break;
            case 4:
                processador.rd3 = processador.rd2;
                processador.aluOut2 = processador.aluOut;
                // Como não tem instrução de acesso à memória, ignora
                this.lmd = 0;
                break;
            // Write-back
            case 5:
                if (this.instrucao == 'lw')
                    processador.registradores[processador.rd3] = processador.lmd;
                else if (this.instrucao != 'nop')
                    processador.registradores[processador.rd3] = processador.aluOut2;
                break;
        }
    }
}

// Atualiza valores de registros na tabela
function atualizaTabela() {
    let cells = document.getElementsByTagName("td");
    for (let i = 2, j = 0; i < cells.length; i += 3, ++j)
        cells[i].innerText = processador.registradores[j].toString(2);
}

// Adiciona instrução escrita graficamente e internamente no processador
botaoAdicao.addEventListener("click", (e) => {
    let curDiv = document.createElement("span"),
        i = processador.adicionaInstrucao(),
        num = lista.children.length;
    curDiv.innerHTML = `i${num}: ${i.toString()}`;
    lista.appendChild(curDiv);
    lista.scrollTo({
        top: lista.scrollHeight,
        left: 0
    });
});

// Confere se necessário exibir campo de imediato
function exibeCampos() {
    if (instrucoesImediatoIndices.has(addInstrucao.selectedIndex)) {
        document.getElementById('entradaTemp').setAttribute("style", "display: none");
        document.getElementById('entradaImediato').setAttribute("style", "");
    } else {
        document.getElementById('entradaTemp').setAttribute("style", "");
        document.getElementById('entradaImediato').setAttribute("style", "display: none");
    }
}

function atualizaInstrs() {
    for (let i = 0; i < 5; ++i) {
        if (valsInstrs[i] != '...')
            instrs[i].innerText = `i${valsInstrs[i]}`;
        else
            instrs[i].innerText = `...`;
    }
}

addInstrucao.addEventListener("change", exibeCampos);

// Pula para referências
botRef.addEventListener("click", (e) => {
    window.scrollTo({
        left: 0,
        top: referencias.offsetTop,
        behavior: "smooth"
    });
});

// Volta de referências
botVolta.addEventListener("click", (e) => {
    window.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth"
    });
});

function toggleAnimacoes() {
    imgCards.forEach((obj, idx) => {
        let classes = obj.getAttribute('class'),
            imgSrc = obj.getAttribute('src');

        if (classes.includes("gira")) {
            console.log(obj, "para");

            obj.setAttribute('class', "imgCard");
            obj.setAttribute('src', imgSrc.replace('png', 'gif'));
        } else {
            obj.setAttribute('class', 'imgCard gira')
            obj.setAttribute('src', imgSrc.replace('gif', 'png'));
        }
    });
}

botaoExec.addEventListener('click', async (e) => {
    toggleAnimacoes();
    await processador.executar();
    toggleAnimacoes();
});

function atualizaPergunta() {
    if (counterPergunta >= textos.length)
        return;

    // window.scrollTo({
    //     left: 0,
    //     top: document.body.scrollHeight,
    //     behavior: "smooth"
    // });
    let textoCur = textos[counterPergunta];
    duckyPergunta.innerHTML = `<b>Q:</b> ${textoCur[0]}`;
    duckyResposta.innerHTML = `<b>A:</b> ${textoCur[1]}`;
    counterPergunta++;
}

ducky.addEventListener('click', (e) => {
    atualizaPergunta();
});

// Atualiza tabela com valores zerados iniciais
atualizaTabela();
atualizaPergunta();
