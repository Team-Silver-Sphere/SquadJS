import { request } from 'graphql-request';

const API_ENDPOINT = 'https://squad-community-ban-list.com/graphql';

export default function(query, variables) {
  return request(API_ENDPOINT, query, variables);
}
