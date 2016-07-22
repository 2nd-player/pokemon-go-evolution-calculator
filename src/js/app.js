// This file is part of Pokemon Go Evolution Calculator.
//
// Pokemon Go Evolution Calculator is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Pokemon Go Evolution Calculator is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Pokemon Go Evolution Calculator.  If not, see <http://www.gnu.org/licenses/>.

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
      instructions[instructions.length-1] = 'ポッポを ' + count + ' 匹進化させる.';
    } else {
      instructions.push('ポッポを 1 匹進化させる.');
    }

    calculations.evolutions = calculations.evolutions + 1;
    resources.pidgeys = resources.pidgeys - 1;
    resources.pidgeottos = resources.pidgeottos + 1;
    resources.candy = resources.candy - CANDY_PER_EVOLUTION + 1;
  }

  function transferPidgeotto(calculations, resources, instructions, count) {
    instructions.push('ピジョンを ' + count + ' 匹転送する.');
    calculations.pidgeottoTransfers = calculations.pidgeottoTransfers + count;
    resources.pidgeottos = resources.pidgeottos - count;
    resources.candy = resources.candy + count;
  }

  function transferPidgey(calculations, resources, instructions, count) {
    instructions.push('ポッポを ' + count + ' 匹転送する.');
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
      instructions.push('ポッポを ' + calculations.pidgeyTransfers + ' 匹転送する.')
    }

    if (calculations.pidgeottoTransfers > 0 && startingResources.pidgeottos > 0) {
      var pidgeottoToTransfer = Math.min(calculations.pidgeottoTransfers, startingResources.pidgeottos);
      startingResources.pidgeottos -= pidgeottoToTransfer;
      startingResources.candy += pidgeottoToTransfer;
      instructions.push('ピジョンを ' + pidgeottoToTransfer + ' 匹転送する.')
    }

    instructions.push('しあわせタマゴを使う.');

    var instructionCalculations = {
      evolutions: 0,
      pidgeyTransfers: 0,
      pidgeottoTransfers: 0
    };

    calculateEvolutions(instructionCalculations, startingResources, instructions);

    if (instructions.length == 1) {
      var pidgeyToCatch = oneEvolution(form);
      instructions[0] = 'ポッポを あと ' + pidgeyToCatch + ' 匹捕まえる.';
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
