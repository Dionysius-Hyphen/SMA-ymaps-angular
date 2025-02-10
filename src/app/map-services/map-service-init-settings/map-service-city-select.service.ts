import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapServiceCitySelectService {

  constructor() { }

  // Настройка отображения города по умолчанию
  spb_point = [59.93245701691211, 30.3579130053922]
  mapCenter:number[]|any = this.spb_point
  mapInitZoom:number = 12

  // Список городов для быстрого выбора на карте
  default_zoom:number = 9

  citySelector = [{
    content: 'Москва',
    center: [55.751574, 37.573856],
    zoom: this.default_zoom
  },
  
  {
    content: 'Санкт-Петербург',
    center: this.spb_point,
    zoom: this.default_zoom
  },

  {
    content: 'Омск',
    center: [54.990215, 73.365535],
    zoom: this.default_zoom
  },

  {
    content: 'Новгород',
    center: [58.539244168719485, 31.252706726744687],
    zoom: this.default_zoom
  }
]

func_a = function (a:number){
  console.log("AAAAAAAAAAAAAA: ",a)
}

public addCitySelectorButton(ymaps:any, map:any){
      //////////////////////////////////////////////////////////////////////// Buttons ////////////////////////////////////////////////////////////////////////
      // Создадим собственный макет выпадающего списка.
      const ListBoxLayout = ymaps.templateLayoutFactory.createClass(
        "<div class='button_x'>"+
        "<button id='my-listbox-header' class='btn btn-success dropdown-toggle' data-toggle='dropdown'>" +
            "{{data.title}} <span class='caret'></span>" +
        "</button>" +
        // Этот элемент будет служить контейнером для элементов списка.
        // В зависимости от того, свернут или развернут список, этот контейнер будет
        // скрываться или показываться вместе с дочерними элементами.
        "<ul id='my-listbox'" +
            " class='dropdown-menu' role='menu' aria-labelledby='dropdownMenu'" +
            " style='display: {% if state.expanded %}block{% else %}none{% endif %};'></ul>"+
        "</div>", {

        build: function() {
            // Вызываем метод build родительского класса перед выполнением
            // дополнительных действий.
            ListBoxLayout.superclass.build.call(this);

            this.childContainerElement = document.querySelector('#my-listbox');
            // Генерируем специальное событие, оповещающее элемент управления
            // о смене контейнера дочерних элементов.
            this.events.fire('childcontainerchange', {
                newChildContainerElement: this.childContainerElement,
                oldChildContainerElement: null
            });
        },

        // Переопределяем интерфейсный метод, возвращающий ссылку на
        // контейнер дочерних элементов.
        getChildContainerElement: function () {
            return this.childContainerElement;
        },

        clear: function () {
            // Заставим элемент управления перед очисткой макета
            // откреплять дочерние элементы от родительского.
            // Это защитит нас от неожиданных ошибок,
            // связанных с уничтожением dom-элементов в ранних версиях ie.
            this.events.fire('childcontainerchange', {
                newChildContainerElement: null,
                oldChildContainerElement: this.childContainerElement
            });
            this.childContainerElement = null;
            // Вызываем метод clear родительского класса после выполнения
            // дополнительных действий.
            ListBoxLayout.superclass.clear.call(this);
        }
    });

    // Также создадим макет для отдельного элемента списка.
    const ListBoxItemLayout = ymaps.templateLayoutFactory.createClass(
        "<li><a>{{data.content}}</a></li>"
    );

    // Создадим пункты выпадающего списка
    const listBoxItems = this.citySelector.map((city:any) => {
      return new ymaps.control.ListBoxItem({data: city})
    })

    // Теперь создадим список, содержащий эти пункты.
    const listBox = new ymaps.control.ListBox({
            items: listBoxItems,
            data: {
                title: 'Выберите город'
            },
            options: {
                // С помощью опций можно задать как макет непосредственно для списка,
                layout: ListBoxLayout,
                // так и макет для дочерних элементов списка. Для задания опций дочерних
                // элементов через родительский элемент необходимо добавлять префикс
                // 'item' к названиям опций.
                itemLayout: ListBoxItemLayout
            }
        });

    listBox.events.add('click', (e:any) => {
        // Получаем ссылку на объект, по которому кликнули.
        // События элементов списка пропагируются
        // и их можно слушать на родительском элементе.
        var item = e.get('target');
        // Клик на заголовке выпадающего списка обрабатывать не надо.
        if (item != listBox) {
            map.setCenter(
                item.data.get('center'),
                item.data.get('zoom')
            );
        }
    });

    return listBox
  }




}
