export interface Author {
  id: number;
  first_name: string;
  last_name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Publisher {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  floor: number;
  section: string;
  shelf: string;
}

export interface Copy {
  id: number;
  condition: string;
  available: boolean;
  location: Location;
}

export interface Book {
  id: number;
  title: string;
  ean: string;
  description: string;
  publish_year: number;
  publisher: Publisher;
  authors: Author[];
  categories: Category[];
  copies: Copy[];
}
