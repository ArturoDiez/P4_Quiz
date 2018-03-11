const {log, biglog, errorlog, colorize} = require("./out.js");

const model = require ('./model.js');

/**
*Muestra la ayuda
*/
exports.helpCmd = rl => {
	 console.log("Commandos:");
  	  console.log( "h|help - Muestra esta ayuda.");
  	  console.log(" list -Listar los quizzes existentes.");
  	  console.log(" show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
  	  console.log(" add - Añadir un nuevo quiz interactivamente.");
  	  console.log(" delete <id> - Borrar el quiz indicado.");
  	  console.log(" edit <id> - Editar el quiz indicado.");
  	  console.log(" test <id> - Probar el quiz indicado.");
      console.log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
      console.log(" credits - Créditos.");
      console.log(" q|quit - Salir del programa.");
      rl.prompt();
  };

/**
 *Lista todos los quizzes existentes en el modelo
 *
 *@param rl Objeto readline usado para implementar el CLI
 */
 exports.listCmd = rl => {
 	
 	model.getAll().forEach((quiz,id)=>{

 		log(` [${colorize(id,'magenta')}]:${quiz.question} `);
 	});
 	rl.prompt();
 };

 /**
  *Añade un nuevo quiz al modelo
  *Pregunta interactivamente por la pregunta y por la respuesta
  *
  *@param rl Objeto readline usado para implementar el CLI
  */
  exports.addCmd = rl => {
  	rl.question(colorize(' Introduzca una pregunta:','red'), question => {

  		rl.question(colorize(' Introduzca la respuesta:','red'), answer =>{

  			model.add(question, answer);
  			log(` ${colorize('Se ha añadido','magenta')}: ${question} ${colorize('=>','magenta')} ${answer}`);
  			rl.prompt();
  		});
  	});
  };

  /**
   *Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
   *
   *@param rl Objeto readline usado para implementar el CLI
   *@param id Clave del quiz a mostrar
   */
   exports.showCmd = (rl, id) => {
   	 if (typeof id === "undefined"){
   	 	errorlog(`Falta el parámtero id`);
   	 } else {
   	 	try{
   	 		const quiz = model.getByIndex(id);
   	 		log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
   	 	} catch(error){
   	 		errorlog(error.message);
   	 	}
   	 }
   	rl.prompt();
   };

/**
 *Borra un quiz del modelo
 *
 *@param rl Objeto readline usado para implementar el CLI
 *@param id Clave del quiz a borrar en el modelo
 */
 exports.deleteCmd = (rl, id) => {
 	if (typeof id === "undefined") {
 		errorlog(`Falta el parámetro id`);
 	} else {
        try {
        	model.deleteByIndex(id);
        } catch(error){
        	errorlog(error.message);
        }
 	}
 	rl.prompt();
 };

 /**
  *Edita un quiz del modelo
  *
  *@param rl Objeto readline usado para implementar el CLI
  *@param id Clave del quiz a borrar en el modelo
  */
  exports.editCmd = (rl, id) => {
  	if (typeof id === "undefined") {
  		errorlog(`Falta el parámetro id`);
  		rl.prompt();
  	} else {
  		try{
  			const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
            
            rl.question(colorize(' Introduzca una pregunta:', 'red'), question => {
  				
  				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

  				rl.question(colorize(' Introduzca la respuesta:','red'), answer => {
  					model.update(id, question, answer);
  					log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize(answer,'red')}`);
  					rl.prompt();
  				});
  			});

  		} catch (error) {
  			errorlog(error.message);
  			rl.prompt();
  		};
  	};

  	
  };

  /**
   *Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar
   *
   *@param rl Objeto readline usado para implementar el CLI
   *@param id CLave del quiz a probar
   */
   exports.testCmd = (rl, id) => {

   	if (typeof id === "undefined") {
  		errorlog(`Falta el parámetro id`);
  		rl.prompt();
   		}else{
   			try{
                const quiz = model.getByIndex(id);
   	            rl.question(colorize(quiz.question +': ', 'blue'),  resp => {
   	            	if(resp.toLowerCase().trim() === quiz.answer.toLowerCase()){
   	            		log(`Su respuesta es correcta.`);
   	            		biglog(`Correcta`,'green');
   	            	} else {
   	            		log(`Su respuesta es incorrecta.`);
   	            		biglog(`Incorrecta`,'red');
   	            	}
                    rl.prompt();
   	            });	
            } catch (error) {
  			  errorlog(error.message);
  			  rl.prompt();
           };
        };
   };

   /**
    *Pregunta todos los quizzes existentes en el modelo en orden aleatorio
    *Se gana si se contesta a todos satisfactoriamente
    *
    *@param rl Objeto readline usado para implementar el CLI
    */
    exports.playCmd = rl =>{
     
    	let score=0;
        
    	let toBeResolved = [];
        for (let i=0; i<model.count(); i++){
           toBeResolved.push(model.getByIndex(i));
        }
        const playOne = () => {

          if (toBeResolved.length === 0){
        	log(`No hay nada más que preguntar.`);
        	log(`Fin del juego. El número de aciertos es ` + score);
        	rl.prompt();
        } else {
        	try{
        	let id = Math.trunc(Math.random() *toBeResolved.length);
        	let quiz = toBeResolved[id];
        	toBeResolved.splice(id, 1);
            rl.question(colorize(quiz.question +': ', 'blue'),  resp => {
   	            	if(resp.toLowerCase().trim() === quiz.answer.toLowerCase()){
   	                   score++;
   	                   log(`CORRECTO - Llevas `+ score +` aciertos.`);
                       playOne();
   	               } else {
   	               	   log(`INCORRECTO.`);
   	               	   log(`Fin del juego. Aciertos: `+ score);
   	               	   rl.prompt();
   	               }

        });

        } catch (error){
        	errorlog(error.message);
  			  rl.prompt();
  			};
       };

      
   };

       playOne();

    };

    /**
     *Muestra los nombres de los autores de la práctica
     *
     *@param rl Objeto readline usado para implementar el CLI
     */
     exports.creditsCmd = rl => {
     	log('ARTURO','green');
     	rl.prompt();
     };

/**
 *Terminar el programa
 *
 *@param rl Objeto readline usado para implementar el CLI
 */
 exports.quitCmd = rl => {
 	rl.close();
 };
