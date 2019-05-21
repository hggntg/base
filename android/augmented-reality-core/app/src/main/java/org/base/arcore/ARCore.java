package org.base.arcore;

import android.content.Context;
import android.widget.Toast;


public class ARCore {
    public void show(Context context){
        CharSequence text = "Hello NativeScript!";
        int duration = Toast.LENGTH_SHORT;

        Toast toast = Toast.makeText(context, text, duration);
        toast.show();
    }
}
