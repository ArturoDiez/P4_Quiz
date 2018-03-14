const {log, biglog, errorlog, colorize} = require("./out.js");

const models = require ('./model.js');

const Sequelize = require('sequelize');

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
 	
 	models.quiz.findAll()
  .each(quiz => {
      log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
     rl.prompt();
  });
 };

  const makeQuestion = (rl,test) => {

    return new Promise((resolve, reject) => {
      rl.question(colorize(text, 'red'), answer =>{
        resolve(answer.trim());
      });
    });
  };



 /**
  *Añade un nuevo quiz al modelo
  *Pregunta interactivamente por la pregunta y por la respuesta
  *
  *@param rl Objeto readline usado para implementar el CLI
  */
  exports.addCmd = rl => {
  	makeQuestion(rl, 'Introduzca una pregunta: ')
    .then (q => {
      return makeQuestion(rl, 'Introduzca la respuesta: ')
      .then(a=> {
        return {question: q, answer: a};
      });
    })
    .then(quiz => {
      return models.quiz.create(quiz);
    })
    .then((quiz) => {
      log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
    })
    .catch(new Sequelize.ValidationError, error => {
      errorlog('El quiz es erroneo: ');
      error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
    });
  };
  


  const validateId = id => {
     return new Sequelize.Promise((resolve,reject) => {
      if (typeof id === "undefined") {
        reject(new Error(`Falta el parámetro <id>.`));
      } else {
        id = parseInt(id);
        if (Number.isNaN(id)) {
          reject(new Error(`El valor del parámetro <id> no es un número.`));
        } else {
          resolve(id);
        }
      }
     });
  };




  /**
   *Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
   *
   *@param rl Objeto readline usado para implementar el CLI
   *@param id Clave del quiz a mostrar
   */
   exports.showCmd = (rl, id) => {
      validateId(id)
      .then(id => models.quiz.findById(id))
      .then(quiz=> {
        if (!quiz) {
          throw new Error(`No existe un quiz asociado al id= ${id}.`);
        }
        log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
      })
   	  .catch(error => {
        errorlog(error.message);
      })
      .then(() => {
        rl.prompt();
      });
   };

/**
 *Borra un quiz del modelo
 *
 *@param rl Objeto readline usado para implementar el CLI
 *@param id Clave del quiz a borrar en el modelo
 */
 exports.deleteCmd = (rl, id) => {
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
    });
 };

 /**
  *Edita un quiz del modelo
  *
  *@param rl Objeto readline usado para implementar el CLI
  *@param id Clave del quiz a borrar en el modelo
  */
  exports.editCmd = (rl, id) => {
  	validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
      if(!quiz) {
        throw new Error(`No existe un quiz asociado al id= ${id}.`)
      }

      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
      return makeQuestion(rl, 'Intriduzca la pregunta: ')
      .then(q => {
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
        return makeQuestion(rl, 'Introduzca la respuesta: ')
        .then(a => {
          quiz.question = q;
          quiz.answer = a;
          return quiz;
        });
      });
    })
    .then(quiz => {
      return quiz.save();
    })
    .then(quiz => {
      log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
      errorlog('El quiz es erroneo:');
      error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
    });
  };

  /**
   *Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar
   *
   *@param rl Objeto readline usado para implementar el CLI
   *@param id CLave del quiz a probar
   */
   exports.testCmd = (rl,id) => {
    validateId(id)
    .then( id => models.quiz.findById(id))
    .then( quiz => {
        if (!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        return makeQuestion(rl, quiz.question+"?"+" ")
        .then(q => {
            if(q.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
                log('Su respuesta es:', 'black');
                log('CORRECTA', 'green');
            }else{
                log('Su respuesta es:', 'black');
                log('INCORRECTA', 'red');
            }
        });
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};
   /**
    *Pregunta todos los quizzes existentes en el modelo en orden aleatorio
    *Se gana si se contesta a todos satisfactoriamente
    *
    *@param rl Objeto readline usado para implementar el CLI
    */
    exports.playCmd = rl =>{
      let score = 0;

      let toBePlayed=[];
      models.quiz.findAll({raw: true})
      .then(quizzes => {
        toBePlayed=quizzes;
      })

      const playOne = () => {
        return new Promise((resolve, reject) => {
        if(toBePlayed.length === 0){
          log(`No hay nada más que preguntar.`);
          log(`Fin del juego. El número de aciertos es ` + score);
          resolve();
          return;
        } else {
          try{
            let id = Math.trunc(Math.random()*toBePlayed.length);
            let quiz = toBePlayed[id];
            toBePlayed.splice(id,1);

            makeQuestion(rl,quiz.question)
              .then(answer =>{
                if(answer.toLowerCase().trim()===quiz.answer.toLowerCase()){
                  score++;
                  log(`CORRECTO - Llevas `+ score +` aciertos.`);
                  resolve.playOne();
                } else {
                  log(`INCORRECTO.`);
                  log(`Fin del juego. Aciertos: `+ score);
                  rl.prompt();
                }
              })
              .then(() => {
       return playOne();
      })
     
     .then(() => {
      rl.prompt();
     })
           } catch(error){
      errorlog(error.message);
      rl.prompt();
       }

        };
       });
      };
      
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
