'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 
                'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // how do template literals work under the hood?
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on 
                ${months[this.date.getMonth()]} ${this.date.getDate()}`;

        
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling'

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / this.duration;
        return this.speed;
    }
}

class App {
    // ayo private fields???
    #map;
    #mapEvent;
    #mapZoomLevel = 13;
    #workouts = [];

    constructor() {
        this._getPosition();

        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation) {
            // outside of class, calling methods is normal
            // but here, calling loadMap is treated as function call
            // this is therefore set to 'undefined'
            // use the 'bind' method to rectify that(?)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
                alert("roll with the fucking punches")
            });
        }
    }

    _loadMap(position) {
        // console.log(position);
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        const coord = [latitude, longitude];

        // console.log(coord);

        this.#map = L.map('map').setView(coord, this.#mapZoomLevel);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        
        form.style.display = 'none';
        form.classList.add('hidden');
        // what does this do???
        setTimeout(() => form.style.display = 'grid', 1000);
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        // closest is "inverse querySelector"; it selects parents
    }

    _newWorkout(e) {

        // yo var functions???
        const validInputs = (...inputs) => 
            inputs.every(cand => Number.isFinite(cand));

        const isPositive = (...inputs) =>
            inputs.every(cand => cand > 0);

        // don't make it reload page (default behavior)
        e.preventDefault(e);

        const type = inputType.value;
        // very quirk casting
        const distance = + inputDistance.value;
        const duration = + inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        if (type === 'running') {
            const cadence = + inputCadence.value;
            // guard clause
            // return if NOT met
            // trait of modern js
            if (
                !validInputs(distance, duration, cadence) || 
                !isPositive(distance, duration, cadence)
            ) return alert('* why *');

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        if (type === 'cycling') {
            const elevation = + inputElevation.value;
            if (
                !validInputs(distance, duration, elevation) || 
                !isPositive(distance, duration)
            ) return alert('* why *');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        this.#workouts.push(workout);
        // console.log(workout);
        
        this._renderWorkoutMarker(workout);

        this._renderWorkout(workout);

        this._hideForm();

        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 500, 
                autoClose: false, 
                closeOnClick: false, 
                className: `${workout.type}-popup`, 
            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️<br>'} 
                    ${workout.description} <br> ${workout.type}: FIRE IN THE HOLE 🗣️🔥`)
            .openPopup();

        // .setPopupContent(`${workout.type}: FIRE IN THE HOLE 🗣️🔥`)
    }

    _renderWorkout(workout) {
        // what the heavens
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${
                        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                    }</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `;

        if (workout.type === 'running') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `
        }

        if (workout.type === 'cycling') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
            `
        }

        // mayhaps experiment with this
        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        // closest is opp of querySelector
        const workoutElement = e.target.closest('.workout');
        // console.log(workoutElement);

        if (!workoutElement) return;

        // dataset is for html dom stuff
        const workout = this.#workouts.find(
            work => work.id === workoutElement.dataset.id
        );

        // console.log(workout);
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true, 
            pan: {
                duration: 1,
            }
        });
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));

        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work => 
            this._renderWorkout(work)
        );
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const yuh = new App();