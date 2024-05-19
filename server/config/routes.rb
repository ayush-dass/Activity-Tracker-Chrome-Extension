Rails.application.routes.draw do
  post '/api/signup', to: 'users#signup'
  post '/api/login', to: 'users#login'
end
