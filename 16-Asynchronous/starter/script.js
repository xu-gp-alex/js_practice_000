'use strict';

const btn = document.querySelector('.btn-country');
const countriesContainer = document.querySelector('.countries');

///////////////////////////////////////

const renderCountry = function (data) {
    console.log(data);

    // console.log(data.languages);
    // console.log(Object.values(data.languages));

    // console.log(Object.values(data.currencies)[0]);
    // console.log(typeof Object.values(data.currencies)[0]);

    const html = `
    <article class="country">
        <img class="country__img" src="${data.flags.svg}" />
        <div class="country__data">
        <h3 class="country__name">${data.name.common}</h3>
        <h4 class="country__region">${data.region}</h4>
        <p class="country__row"><span>👫</span>${(
            data.population / 1_000_000
        ).toFixed(1)} million</p>
        <p class="country__row"><span>🗣️</span>${
            Object.values(data.languages)[0]
        }</p>
        <p class="country__row"><span>💰</span>${
            Object.values(data.currencies)[0].name
        }</p>
        </div>
    </article>
    `;

    countriesContainer.insertAdjacentHTML('beforeend', html);
    countriesContainer.style.opacity = 1;
};

const getCountryAndNeighbor = function (country) {
    const request = new XMLHttpRequest(
        `https://restcountries.com/v3.1/name/${country}`
    );
    request.open('GET', `https://restcountries.com/v3.1/name/${country}`);
    request.send();

    request.addEventListener('load', function () {
        const countryData = JSON.parse(this.responseText)[
            country === 'china' || country === 'iran' ? 1 : 0
        ];
        renderCountry(countryData);
    });
};

getCountryAndNeighbor('iran');
