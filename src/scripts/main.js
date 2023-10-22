// Define the project name
// Define o nome do projeto
const projectName = 'choropleth';

// Select the 'body' and 'svg' elements from the HTML
// Seleciona os elementos 'body' e 'svg' do HTML
var body = d3.select('body');
var svg = d3.select('svg');

// Create a tooltip div for showing additional information
// Cria um div de dica para mostrar informações adicionais
var tooltip = body
  .append('div')
  .attr('class', 'tooltip')
  .attr('id', 'tooltip')
  .style('opacity', 0);

// Set up D3 geoPath, scale, and color functions
// Configura funções D3 para caminho geográfico, escala e cor
var path = d3.geoPath();
var x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);
var color = d3
  .scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
  .range(d3.schemeGreens[9]);

// Create a group ('g') element for the legend
// Cria um grupo ('g') para a legenda
var g = svg
  .append('g')
  .attr('class', 'key')
  .attr('id', 'legend')
  .attr('transform', 'translate(0,40)');

// Add colored rectangles to the legend
// Adiciona retângulos coloridos à legenda
g.selectAll('rect')
  .data(
    color.range().map(function (d) {
      // Handle cases where data values are null
      // Lida com casos em que os valores de dados são nulos
      d = color.invertExtent(d);
      if (d[0] === null) {
        d[0] = x.domain()[0];
      }
      if (d[1] === null) {
        d[1] = x.domain()[1];
      }
      return d;
    })
  )
  .enter()
  .append('rect')
  .attr('height', 8)
  .attr('x', function (d) {
    return x(d[0]);
  })
  .attr('width', function (d) {
    return d[0] && d[1] ? x(d[1]) - x(d[0]) : x(null);
  })
  .attr('fill', function (d) {
    return color(d[0]);
  });

// Add a caption for the legend
// Adiciona uma legenda ao gráfico
g.append('text')
  .attr('class', 'caption')
  .attr('x', x.range()[0])
  .attr('y', -6)
  .attr('fill', '#000')
  .attr('text-anchor', 'start')
  .attr('font-weight', 'bold');

// Create URLs for JSON data files
// Cria URLs para arquivos de dados JSON
const EDUCATION_FILE =
  'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const COUNTY_FILE =
  'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

// Load JSON data asynchronously
// Carrega dados JSON de forma assíncrona
Promise.all([d3.json(COUNTY_FILE), d3.json(EDUCATION_FILE)])

// Call 'ready' function when data is loaded
// Chama a função 'pronto' quando os dados forem carregados
  .then((data) => ready(data[0], data[1]))
// Handle any errors
// Trata quaisquer erros
  .catch((err) => console.log(err)); 

// 'ready' function to handle the loaded data
// Função 'pronto' para lidar com os dados carregados
function ready(us, education) {
  // Append paths to represent counties on the map
  // Adiciona caminhos para representar os condados no mapa
  svg
    .append('g')
    .attr('class', 'counties')
    .selectAll('path')
    .data(topojson.feature(us, us.objects.counties).features)
    .enter()
    .append('path')
    .attr('class', 'county')
    .attr('data-fips', function (d) {
      return d.id;
    })
    .attr('data-education', function (d) {
      var result = education.filter(function (obj) {
        return obj.fips === d.id;
      });
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }

      console.log('could not find data for: ', d.id);
      return 0;
    })
    .attr('fill', function (d) {
      var result = education.filter(function (obj) {
        return obj.fips === d.id;
      });
      if (result[0]) {
        return color(result[0].bachelorsOrHigher);
      }
      return color(0);
    })
    .attr('d', path)
    .on('mouseover', function (event, d) {
      // Show tooltip on mouseover
      // Mostra a dica no evento de passagem do mouse
      tooltip.style('opacity', 0.9);
      tooltip
        .html(function () {
          var result = education.filter(function (obj) {
            return obj.fips === d.id;
          });
          if (result[0]) {
            return (
              result[0]['area_name'] +
              ', ' +
              result[0]['state'] +
              ': ' +
              result[0].bachelorsOrHigher +
              '%'
            );
          }
          return 0;
        })
        .attr('data-education', function () {
          var result = education.filter(function (obj) {
            return obj.fips === d.id;
          });
          if (result[0]) {
            return result[0].bachelorsOrHigher;
          }
          return 0;
        })
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY - 28 + 'px');
    })
    .on('mouseout', function () {
      // Hide tooltip on mouseout
      // Esconde a dica no evento de retirada do mouse
      tooltip.style('opacity', 0);
    });

  // Add state boundaries to the map
  // Adiciona os limites dos estados ao mapa
  svg
    .append('path')
    .datum(
      topojson.mesh(us, us.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr('class', 'states')
    .attr('d', path);
}
