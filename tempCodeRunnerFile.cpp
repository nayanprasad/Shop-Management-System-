#include<iostream>
using namespace std;
void swap(int *x,int *y){
    int temp= *x;
    *x=*y;
    *y=temp;}
    void swap(int x,int y){
        int temp=x;
        x=y;
        y=temp;
        swap(a,b);
    }
    int main()
    {
        int a,b;
        cout<<"\n enter 2 integers:";
         cin>>a>>b;
         cout<<"\n the numbers before swapping:\tA="<<a<<"tB="<<b;
         swap(&a,&b);
         cout<<"\n the swapped numbers are:'\tA="<<a<<"tB="<<b;
        return 0;  
    }
void swap(int x,int y){
        int temp=x;
        x=y;
        y=temp;}
         {
        int a,b;
        cout<<"\n enter 2 integers:";
         cin>>a>>b;
         cout<<"\n the numbers before swapping:\tA="<<a<<"tB="<<b;
         swap(a,b);
         cout<<"\n the swapped numbers are:'\tA="<<a<<"tB="<<b;
         return 0;
    }
