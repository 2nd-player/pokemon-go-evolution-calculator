// This file is part of PogoCalc.
//
// PogoCalc is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// PogoCalc is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with PogoCalc.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

var app = angular.module('PogoCalc', [])

app.controller('PogoCalcController', ['$scope', PogoCalcController]);

function PogoCalcController($scope) {
  var CANDY_PER_EVOLUTION = 12;
  var CANDY_PER_CATCH = 3;

  $scope.form = {
    pidgey: 1,
    keepPidgey: true,
    pidgeotto: 1,
    keepPidgeotto: true,
    pidgeyCandy: 1
  };

  $scope.$watch('form', function (val) {
    calculate(val);
  }, true);

  function parseResources(form) {
    var resources = {
      pidgeys: parseInt(form.pidgey, 10) - (form.keepPidgey ? 1 : 0),
      pidgeottos: parseInt(form.pidgeotto, 10) - (form.keepPidgeotto ? 1 : 0),
      candy: parseInt(form.pidgeyCandy, 10)
    };

    if (resources.pidgeys < 0 || isNaN(resources.pidgeys)) {
      resources.pidgeys = 0;
    }

    if (resources.pidgeottos < 0 || isNaN(resources.pidgeottos)) {
      resources.pidgeottos = 0;
    }

    if (resources.candy < 0 || isNaN(resources.candy)) {
      resources.candy = 0;
    }

    return resources;
  }

  function evolve(calculations, resources, instructions) {
    if (instructions[instructions.length-1] &&
        instructions[instructions.length-1].substring(0, 6) == 'Evolve') {
      var re = /Evolve (\d*)/;
      var match = re.exec(instructions[instructions.length-1]);
      var count = parseInt(match[1], 10) + 1;
      instructions[instructions.length-1] = 'Evolve ' + count + ' Pidgey.';
    } else {
      instructions.push('Evolve 1 Pidgey.');
    }

    calculations.evolutions = calculations.evolutions + 1;
    resources.pidgeys = resources.pidgeys - 1;
    resources.pidgeottos = resources.pidgeottos + 1;
    resources.candy = resources.candy - CANDY_PER_EVOLUTION + 1;
  }

  function transferPidgeotto(calculations, resources, instructions, count) {
    instructions.push('Transfer ' + count + ' Pidgeotto.');
    calculations.pidgeottoTransfers = calculations.pidgeottoTransfers + count;
    resources.pidgeottos = resources.pidgeottos - count;
    resources.candy = resources.candy + count;
  }

  function transferPidgey(calculations, resources, instructions, count) {
    instructions.push('Transfer ' + count + ' Pidgey.');
    calculations.pidgeyTransfers = calculations.pidgeyTransfers + count;
    resources.pidgeys = resources.pidgeys - count;
    resources.candy = resources.candy + count;
  }

  function calculateEvolutions(calculations, resources, instructions) {
    var done = false;

    while (!done) {
      if (resources.pidgeys <= 0 && resources.pidgeys < 13) {
        done = true;
      } else if (resources.candy >= CANDY_PER_EVOLUTION) {
        evolve(calculations, resources, instructions);

      } else if (resources.pidgeottos + resources.candy >= CANDY_PER_EVOLUTION) {
        var pidgeottoToTransfer = CANDY_PER_EVOLUTION - resources.candy;
        transferPidgeotto(calculations, resources, instructions, pidgeottoToTransfer);

      } else if (resources.pidgeottos + resources.pidgeys - 1 + resources.candy >= CANDY_PER_EVOLUTION) {
        transferPidgeotto(calculations, resources, instructions, resources.pidgeottos);
        var pidgeyToTransfer = CANDY_PER_EVOLUTION - resources.candy;
        transferPidgey(calculations, resources, instructions, pidgeyToTransfer);

      } else {
        done = true;
      }
    }
  }

  function oneEvolution(form)
  {
    var toCatch = 0;
    var resources = parseResources(form);

    while (true) {
      var calculations = {
        evolutions: 0,
        pidgeyTransfers: 0,
        pidgeottoTransfers: 0
      };

      var resources = parseResources(form);
      resources.pidgeys += toCatch;
      resources.candy += toCatch * CANDY_PER_CATCH;

      var instructions = [];

      calculateEvolutions(calculations, resources, instructions);

      if (calculations.evolutions > 0) {
        return toCatch;
      } else {
        toCatch++;
      }
    }
  }

  function minimizeCandy(form)
  {
    var resources = parseResources(form);

    if (resources.candy <= 5000) {
      var toCatch = 0;

      while (true) {
        var calculations = {
          evolutions: 0,
          pidgeyTransfers: 0,
          pidgeottoTransfers: 0
        };

        var resources = parseResources(form);
        resources.pidgeys += toCatch;
        resources.candy += toCatch * CANDY_PER_CATCH;

        var instructions = [];

        calculateEvolutions(calculations, resources, instructions);

        if (resources.candy <= 1) {
          return toCatch;
        } else {
          toCatch++;
        }
      }
    }
    else {
      return 'N/A';
    }
  }

  function calculateInstructions(form, calculations) {
    var instructions = [];

    var startingResources = parseResources(form);

    if (calculations.pidgeyTransfers > 0) {
      startingResources.pidgeys -= calculations.pidgeyTransfers;
      startingResources.candy += calculations.pidgeyTransfers;
      instructions.push('Transfer ' + calculations.pidgeyTransfers + ' Pidgey.')
    }

    if (calculations.pidgeottoTransfers > 0 && startingResources.pidgeottos > 0) {
      var pidgeottoToTransfer = Math.min(calculations.pidgeottoTransfers, startingResources.pidgeottos);
      startingResources.pidgeottos -= pidgeottoToTransfer;
      startingResources.candy += pidgeottoToTransfer;
      instructions.push('Transfer ' + pidgeottoToTransfer + ' Pidgeotto.')
    }

    instructions.push('Activate Lucky Egg.');

    var instructionCalculations = {
      evolutions: 0,
      pidgeyTransfers: 0,
      pidgeottoTransfers: 0
    };

    calculateEvolutions(instructionCalculations, startingResources, instructions);

    if (instructions.length == 1) {
      var pidgeyToCatch = oneEvolution(form);
      instructions[0] = 'Catch ' + pidgeyToCatch + ' more Pidgey.';
    }

    $scope.instructions = instructions;
  }

  function calculate(form) {
    var calculations = {
      evolutions: 0,
      pidgeyTransfers: 0,
      pidgeottoTransfers: 0
    };

    var resources = parseResources(form);

    var instructions = [];

    calculateEvolutions(calculations, resources, instructions);

    resources.pidgeys = resources.pidgeys + (form.keepPidgey ? 1 : 0);
    resources.pidgeottos = resources.pidgeottos + (form.keepPidgeotto ? 1 : 0);

    calculations.pidgeyToCatch = minimizeCandy(form);

    $scope.calculations = calculations;
    $scope.resources = resources;

    calculateInstructions(form, calculations);
  }
}
