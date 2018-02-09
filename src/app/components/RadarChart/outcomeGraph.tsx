// originated from github.com/ALDLife/outcome-graph

import * as Chart from 'chart.js';
import {SessionsConverter} from './sessionsConverter';
const sessionsConverter = SessionsConverter();

export function getOutcomeGraph(canvasDiv, title, data) {
  const chartConfig = getConfig(data, title);
  const canvasElement = document.getElementById(canvasDiv);
  if (canvasElement === null) {
    throw new Error('The canvas element specified does not exist!');
  }

  return new Chart(canvasElement, chartConfig);
}

function getConfig(data, title) {
  return {
    type: 'radar',
    data: sessionsConverter.getChartJSConvertedData(data),
    options: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
      scale: {
        ticks: {
          beginAtZero: true,
        },
      },
      tooltips: {
        mode: 'point',
        enabled: true,
      },
    },
  };
}

module.exports.getOutcomeGraph = getOutcomeGraph;
