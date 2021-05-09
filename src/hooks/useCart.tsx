import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // Buscar dados do localStorage
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // Verifica se o produto ja existe no carrinho 
      const productExistsInCart = cart.find(product => product.id === productId)    
      
      if(!productExistsInCart){
        //Buscando o produto pelo ID
        const { data: product } = await api.get<Product>(`/products/${productId}`)
        //Buscando o produto no stock pelo ID
        const { data: stock } = await api.get<Stock>(`/stock/${productId}`)  

        if(stock.amount > 0){
          setCart([...cart, {...product, amount: 1 }]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, 
            {...product, amount: 1 }
          ]));
          toast.success('Produto adicionado ao carrinho');
          return;
        }
      }

      if(productExistsInCart){
        const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

        if(stock.amount > productExistsInCart.amount){
          const addCartProduct = cart.map(cartItem => cartItem.id === productId ? {
            ...cartItem, amount: Number(cartItem.amount) + 1
           } : cartItem);

          setCart(addCartProduct)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(addCartProduct));
          toast.success('Produto adicionado ao carrinho');
        }else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
     
      

    } catch {
      //Erro na busca dos dados
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const productExists = cart.some(cartProduct => cartProduct.id === productId);

      if(!productExists){
        toast.error('Erro na remoção do produto');
        return;
      }

      const updateCart = cart.filter(cartItem => cartItem.id !== productId);
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))

    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if(amount < 1){
        toast.error('Erro na alteração de quantidade do produto');
      }

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`); 

      const productAmount = stock.amount;

      const productIsNotAvaillable = amount > productAmount;

      if(productIsNotAvaillable){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productExists = cart.some(cartProduct => cartProduct.id === productId);

      if(!productExists){
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const updateCart = cart.map(cartItem => cartItem.id === productId ? {
        ...cartItem,
        amount: amount
      }: cartItem)

      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ 
        cart,
        addProduct,
        removeProduct,
        updateProductAmount 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
