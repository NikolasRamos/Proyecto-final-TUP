export default class TournamentFormatStrategy {
  constructor(format) {
    if (new.target === TournamentFormatStrategy) {
      throw new TypeError(
        "TournamentFormatStrategy es una interfaz y no puede instanciarse directamente",
      );
    }

    this.format = format;
  }

  validate() {
    throw new Error("La estrategia debe implementar validate(tournament)");
  }
}
